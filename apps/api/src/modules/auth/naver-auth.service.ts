import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { randomBytes } from "node:crypto";

type NaverTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: string;
  error?: string;
  error_description?: string;
};

type NaverProfileResponse = {
  resultcode: string;
  message: string;
  response?: {
    id: string;
    email?: string;
    nickname?: string;
    profile_image?: string;
  };
};

@Injectable()
export class NaverAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;
  private readonly mobileCallbackUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = configService.getOrThrow<string>("oauth.naver.clientId");
    this.clientSecret = configService.getOrThrow<string>(
      "oauth.naver.clientSecret",
    );
    this.callbackUrl = configService.getOrThrow<string>(
      "oauth.naver.callbackUrl",
    );
    this.mobileCallbackUrl = configService.getOrThrow<string>(
      "oauth.naver.mobileCallbackUrl",
    );
  }

  createAuthorizationRequest() {
    const state = randomBytes(32).toString("base64url");

    const authorizationUrl = new URL(
      "https://nid.naver.com/oauth2.0/authorize",
    );

    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("client_id", this.clientId);
    authorizationUrl.searchParams.set("redirect_uri", this.callbackUrl);
    authorizationUrl.searchParams.set("state", state);

    return {
      authorizationUrl: authorizationUrl.toString(),
      state,
    };
  }

  createMobileAuthorizationRequest(state: string) {
    if (!state.trim()) {
      throw new BadRequestException(
        "네이버 모바일 로그인 state가 필요합니다.",
      );
    }

    const authorizationUrl = new URL(
      "https://nid.naver.com/oauth2.0/authorize",
    );

    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("client_id", this.clientId);
    authorizationUrl.searchParams.set(
      "redirect_uri",
      this.mobileCallbackUrl,
    );
    authorizationUrl.searchParams.set("state", state);

    return {
      authorizationUrl: authorizationUrl.toString(),
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
      throw new UnauthorizedException("네이버 로그인이 취소되었습니다.");
    }

    if (
      !code ||
      !state ||
      !savedState ||
      state !== savedState
    ) {
      throw new BadRequestException(
        "네이버 인증 상태가 유효하지 않습니다.",
      );
    }

    const accessToken = await this.exchangeCode(
      code,
      state,
      this.callbackUrl,
    );

    return this.getProfile(accessToken);
  }

  async completeMobileLogin(input: {
    code?: unknown;
    state?: unknown;
  }) {
    const code = this.toOptionalString(input.code);
    const state = this.toOptionalString(input.state);

    if (!code || !state) {
      throw new BadRequestException(
        "네이버 모바일 인증 정보가 없습니다.",
      );
    }

    const accessToken = await this.exchangeCode(
      code,
      state,
      this.mobileCallbackUrl,
    );

    return this.getProfile(accessToken);
  }

  private toOptionalString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
  }

  private async exchangeCode(
    code: string,
    state: string,
    redirectUri: string,
  ) {
    try {
      const tokenResponse = await axios.get<NaverTokenResponse>(
        "https://nid.naver.com/oauth2.0/token",
        {
          params: {
            grant_type: "authorization_code",
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: redirectUri,
            code,
            state,
          },
        },
      );

      const accessToken = tokenResponse.data.access_token;

      if (!accessToken) {
        throw new Error("네이버 Access Token이 없습니다.");
      }

      return accessToken;
    } catch {
      throw new UnauthorizedException(
        "네이버 인증 토큰을 발급받지 못했습니다.",
      );
    }
  }

  private async getProfile(accessToken: string) {
    try {
      const profileResponse = await axios.get<NaverProfileResponse>(
        "https://openapi.naver.com/v1/nid/me",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const profile = profileResponse.data.response;

      if (!profile?.id) {
        throw new Error("네이버 사용자 정보가 없습니다.");
      }

      return {
        providerUserId: profile.id,
        email: profile.email?.trim().toLowerCase() ?? null,
        emailVerified: Boolean(profile.email),
        profileImageUrl: profile.profile_image ?? null,
      };
    } catch {
      throw new UnauthorizedException(
        "네이버 사용자 정보를 확인할 수 없습니다.",
      );
    }
  }
}
