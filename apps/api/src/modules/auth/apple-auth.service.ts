import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import appleSignin from "apple-signin-auth";
import { randomBytes } from "node:crypto";

import { AuthService } from "./auth.service";

@Injectable()
export class AppleAuthService {
  private readonly clientId: string;
  private readonly mobileClientId: string;
  private readonly teamId: string;
  private readonly keyId: string;
  private readonly privateKey: string;
  private readonly callbackUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    this.clientId = configService.getOrThrow<string>("oauth.apple.clientId");
    this.mobileClientId =
      configService.get<string>("oauth.apple.mobileClientId") ??
      "site.cinemo.app";
    this.teamId = configService.getOrThrow<string>("oauth.apple.teamId");
    this.keyId = configService.getOrThrow<string>("oauth.apple.keyId");
    this.privateKey = configService.getOrThrow<string>(
      "oauth.apple.privateKey",
    );
    this.callbackUrl = configService.getOrThrow<string>(
      "oauth.apple.callbackUrl",
    );
  }

  createAuthorizationRequest() {
    const state = randomBytes(32).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");

    const authorizationUrl = new URL(
      appleSignin.getAuthorizationUrl({
        clientID: this.clientId,
        redirectUri: this.callbackUrl,
        responseMode: "form_post",
        scope: "name email",
        state,
      }),
    );

    authorizationUrl.searchParams.set("nonce", nonce);

    return {
      authorizationUrl: authorizationUrl.toString(),
      state,
      nonce,
    };
  }

  async exchangeCode(code: string, nonce: string) {
    const clientSecret = appleSignin.getClientSecret({
      clientID: this.clientId,
      teamID: this.teamId,
      keyIdentifier: this.keyId,
      privateKey: this.privateKey,
      expAfter: 300,
    });

    const tokenResponse = await appleSignin.getAuthorizationToken(code, {
      clientID: this.clientId,
      redirectUri: this.callbackUrl,
      clientSecret,
    });

    const idToken = await appleSignin.verifyIdToken(tokenResponse.id_token, {
      audience: this.clientId,
      nonce,
      ignoreExpiration: false,
    });

    return {
      providerUserId: idToken.sub,
      email: idToken.email ?? null,
      emailVerified:
        idToken.email_verified === true || idToken.email_verified === "true",
      refreshToken: tokenResponse.refresh_token,
    };
  }

  async verifyMobileIdentityToken(identityToken: string) {
    try {
      const idToken = await appleSignin.verifyIdToken(identityToken, {
        audience: this.mobileClientId,
        ignoreExpiration: false,
      });

      return {
        providerUserId: idToken.sub,
        email: idToken.email ?? null,
        emailVerified:
          idToken.email_verified === true || idToken.email_verified === "true",
      };
    } catch {
      throw new UnauthorizedException("Apple 인증 토큰이 유효하지 않습니다.");
    }
  }

  async revokeMobileAuthorization(code: string, expectedSubject: string) {
    const clientSecret = appleSignin.getClientSecret({
      clientID: this.mobileClientId,
      teamID: this.teamId,
      keyIdentifier: this.keyId,
      privateKey: this.privateKey,
      expAfter: 300,
    });
    const credentials = { client_id: this.mobileClientId, client_secret: clientSecret };
    try {
      const tokenResponse = await fetch("https://appleid.apple.com/auth/token", {
        method: "POST",
        body: new URLSearchParams({ ...credentials, code, grant_type: "authorization_code" }),
        signal: AbortSignal.timeout(6000),
      });
      if (!tokenResponse.ok) {
        throw new BadRequestException("Apple 인증을 다시 진행해 주세요.");
      }

      const token = await tokenResponse.json() as { id_token?: string; refresh_token?: string };
      if (!token.id_token || !token.refresh_token) {
        throw new BadRequestException("Apple 인증을 다시 진행해 주세요.");
      }
      const identity = await this.verifyMobileIdentityToken(token.id_token);
      if (identity.providerUserId !== expectedSubject) {
        throw new UnauthorizedException("현재 계정에 연결된 Apple 계정으로 인증해 주세요.");
      }

      const revokeResponse = await fetch("https://appleid.apple.com/auth/revoke", {
        method: "POST",
        body: new URLSearchParams({
          ...credentials,
          token: token.refresh_token,
          token_type_hint: "refresh_token",
        }),
        signal: AbortSignal.timeout(6000),
      });
      if (!revokeResponse.ok) throw new Error("Apple revoke failed");
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) throw error;
      throw new ServiceUnavailableException("Apple 인증 연결을 해제하지 못했습니다. 다시 시도해 주세요.");
    }
  }

  async completeLogin(input: {
    code?: string;
    state?: string;
    error?: string;
    savedState?: string;
    savedNonce?: string;
  }) {
    if (input.error) {
      throw new UnauthorizedException("Apple 로그인이 취소되었습니다.");
    }

    if (
      !input.code ||
      !input.state ||
      !input.savedState ||
      input.state !== input.savedState ||
      !input.savedNonce
    ) {
      throw new BadRequestException("Apple 인증 상태가 유효하지 않습니다.");
    }

    const appleUser = await this.exchangeCode(
      input.code,
      input.savedNonce,
    );

    return this.authService.loginWithApple(appleUser);
  }
}
