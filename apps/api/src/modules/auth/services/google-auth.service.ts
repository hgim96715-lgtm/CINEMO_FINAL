import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { randomBytes } from "node:crypto";

const GOOGLE_ISSUERS: string[] = [
  "https://accounts.google.com",
  "accounts.google.com",
];

type GoogleTokenResponse = {
  id_token?: string;
  error?: string;
  error_description?: string;
};

@Injectable()
export class GoogleAuthService {
  private readonly clientId: string;
  private readonly mobileClientId: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;
  private readonly googleKeys = createRemoteJWKSet(
    new URL("https://www.googleapis.com/oauth2/v3/certs"),
  );

  constructor(private readonly configService: ConfigService) {
    this.clientId = configService.getOrThrow<string>(
      "oauth.google.clientId",
    );
    this.mobileClientId =
      configService.get<string>("oauth.google.mobileClientId") ??
      this.clientId;
    this.clientSecret = configService.getOrThrow<string>(
      "oauth.google.clientSecret",
    );
    this.callbackUrl = configService.getOrThrow<string>(
      "oauth.google.callbackUrl",
    );
  }

  createAuthorizationRequest() {
    const state = randomBytes(32).toString("base64url");
    const authorizationUrl = new URL(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );

    authorizationUrl.searchParams.set("client_id", this.clientId);
    authorizationUrl.searchParams.set("redirect_uri", this.callbackUrl);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", "openid email profile");
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("prompt", "select_account");

    return {
      authorizationUrl: authorizationUrl.toString(),
      state,
    };
  }

  async completeLogin(input: {
    code?: unknown;
    state?: unknown;
    error?: unknown;
    savedState?: unknown;
  }) {
    const code = this.toOptionalString(input.code);
    const state = this.toOptionalString(input.state);
    const error = this.toOptionalString(input.error);
    const savedState = this.toOptionalString(input.savedState);

    if (error) {
      throw new UnauthorizedException("Google 로그인이 취소되었습니다.");
    }

    if (!code || !state || !savedState || state !== savedState) {
      throw new BadRequestException(
        "Google 인증 상태가 유효하지 않습니다.",
      );
    }

    return this.exchangeCode(code);
  }

  private async exchangeCode(code: string) {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    const token = (await tokenResponse.json()) as GoogleTokenResponse;

    if (!tokenResponse.ok || !token.id_token) {
      throw new UnauthorizedException(
        "Google 인증 토큰을 발급받지 못했습니다.",
      );
    }

    try {
      const { payload } = await jwtVerify(token.id_token, this.googleKeys, {
        issuer: GOOGLE_ISSUERS,
        audience: this.clientId,
      });

      const providerUserId = payload.sub;
      const email = typeof payload.email === "string" ? payload.email : null;

      if (!providerUserId || !email || payload.email_verified !== true) {
        throw new Error("Google 이메일 인증 정보가 없습니다.");
      }

      return {
        providerUserId,
        email: email.trim().toLowerCase(),
        emailVerified: true,
      };
    } catch {
      throw new UnauthorizedException(
        "Google 인증 토큰이 유효하지 않습니다.",
      );
    }
  }

  private toOptionalString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
  }

  async verifyMobileIdentityToken(identityToken: string) {
    try {
      const { payload } = await jwtVerify(identityToken, this.googleKeys, {
        issuer: GOOGLE_ISSUERS,
        audience: [this.clientId, this.mobileClientId],
      });

      const providerUserId = payload.sub;
      const email = typeof payload.email === "string" ? payload.email : null;
      const emailVerified = payload.email_verified === true;

      if (!providerUserId || !email || !emailVerified) {
        throw new Error("Google 이메일 인증 정보가 없습니다.");
      }

      return {
        providerUserId,
        email: email.trim().toLowerCase(),
        emailVerified,
      };
    } catch {
      throw new UnauthorizedException(
        "Google 인증 토큰이 유효하지 않습니다.",
      );
    }
  }
}
