import {
  BadRequestException,
  Injectable,
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
