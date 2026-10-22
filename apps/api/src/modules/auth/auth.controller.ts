import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { AuthService } from "./auth.service";
import type { Request, Response } from "express";
import { RegisterRequestDto } from "./dto/requests/register.request.dto";
import { RegisterResponseDto } from "./dto/response/register.response.dto";
import { EmailVerificationService } from "./email-verification.service";
import { VerifyEmailRequestDto } from "./dto/requests/verify-email.request.dto";
import { LoginRequestDto } from "./dto/requests/login.request.dto";
import { Public } from "./decorators/public.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { SessionUser } from "./types/session-user.type";
import { PasswordResetService } from "./password-reset.service";
import { RequestPasswordResetRequestDto } from "./dto/requests/request-password-reset.request.dto";
import { ResetPasswordRequestDto } from "./dto/requests/reset-password.request.dto";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { CheckNicknameRequestDto } from "./dto/requests/check-nickname.request.dto";
import { CheckEmailRequestDto } from "./dto/requests/check-email.request.dto";
import { AppleAuthService } from "./apple-auth.service";
import { GoogleAuthService } from "./google-auth.service";
import { OauthSignupRequestDto } from "./dto/requests/oauth-signup.request.dto";
import { OptionalAuth } from "./decorators/optional-auth.decorator";
import { UpdateProfileVisibilityRequestDto } from "./dto/requests/update-profile-visibility.request.dto";
import { SESSION_COOKIE_NAME } from "./session-cookie";
import { MobileRefreshRequestDto } from "@/modules/auth/dto/requests/mobile-refresh.request.dto";
import { MobileAppleLoginRequestDto } from "@/modules/auth/dto/requests/mobile-apple-login.request.dto";
import { MobileGoogleLoginRequestDto } from "@/modules/auth/dto/requests/mobile-google-login.request.dto";
import { MobileOauthSignupRequestDto } from "@/modules/auth/dto/requests/mobile-oauth-signup.request.dto";
import { NaverAuthService } from "@/modules/auth/naver-auth.service";
import { MobileNaverStartRequestDto } from "@/modules/auth/dto/requests/mobile-naver-start.request.dto";
import { MobileNaverExchangeRequestDto } from "@/modules/auth/dto/requests/mobile-naver-exchange.request.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
    private readonly configService: ConfigService,
    private readonly appleAuthService: AppleAuthService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly naverAuthService: NaverAuthService,
  ) {}

  @ApiCookieAuth("cinemo_session")
  @OptionalAuth()
  @SkipThrottle()
  @Get("me")
  getMe(@Req() request: Request & { user?: SessionUser }) {
    return request.user ?? null;
  }

  @ApiCookieAuth("cinemo_session")
  @Patch("me/profile-visibility")
  @ApiOperation({
    summary: "프로필 공개 범위 변경",
  })
  @ApiOkResponse({
    description: "프로필 공개 범위 변경 성공",
  })
  async updateProfileVisibility(
    @CurrentUser() user: SessionUser,
    @Body() input: UpdateProfileVisibilityRequestDto,
  ) {
    return this.authService.updateProfileVisibility(
      user.id,
      input.profileVisibility,
    );
  }

  @Get("check-nickname")
  @Public()
  checkNickname(@Query() query: CheckNicknameRequestDto) {
    return this.authService.checkNickname(query.nickname);
  }

  @Get("check-email")
  @Public()
  checkEmail(@Query() query: CheckEmailRequestDto) {
    return this.authService.checkEmail(query.email);
  }

  @Public()
  @Post("register")
  @ApiOperation({
    summary: "이메일 회원가입",
    description: "이메일·비밀번호·닉네임과 필수 약관 동의로 회원가입 처리",
  })
  @ApiCreatedResponse({
    type: RegisterResponseDto,
    description: "회원가입 성공",
  })
  @ApiConflictResponse({
    description: "이미 가입된 이메일",
  })
  register(@Body() input: RegisterRequestDto) {
    return this.authService.register(input);
  }

  @Public()
  @Throttle({
    default: {
      limit: 5,
      ttl: 900_000, //15분
    },
  })
  @Post("password-reset/request")
  @ApiOperation({
    summary: "비밀번호 재설정 요청",
    description: "입력한 이메일로 비밀번호 재설정 링크를 발송",
  })
  @ApiOkResponse({
    description: "비밀번호 재설정 요청 접수",
  })
  requestPasswordReset(@Body() input: RequestPasswordResetRequestDto) {
    return this.passwordResetService.request(input);
  }

  @Public()
  @Throttle({
    default: {
      limit: 10,
      ttl: 900_000, // 15분
    },
  })
  @Post("password-reset/confirm")
  @ApiOperation({
    summary: "비밀번호 재설정 확정",
    description: "재설정 토큰을 검증하고 새 비밀번호로 변경",
  })
  @ApiOkResponse({
    description: "비밀번호 재설정 완료",
  })
  resetPassword(@Body() input: ResetPasswordRequestDto) {
    return this.passwordResetService.reset(input);
  }

  @Public()
  @Get("verify-email")
  @ApiOperation({
    summary: "이메일 인증",
    description: "회원가입 이메일 인증 토큰을 검증하고 이메일을 활성화",
  })
  @ApiOkResponse({
    schema: {
      example: {
        verified: true,
        userId: "0198f7a4-7b6e-7abc-8def-123456789abc",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "유효하지 않거나 만료된 인증 링크",
  })
  async verifyEmail(
    @Query() params: VerifyEmailRequestDto,
    @Res() response: Response,
  ) {
    await this.emailVerificationService.verify(params.token);

    const frontendUrl =
      this.configService.getOrThrow<string>("app.frontendUrl");

    return response.redirect(302, `${frontendUrl}/login?verified=true`);
  }

  @Public()
  @Post("mobile/login")
  @ApiOperation({
    summary: "모바일 이메일 로그인",
  })
  @ApiOkResponse({
    description: "Access Token과 Refresh Token 발급",
  })
  @ApiUnauthorizedResponse({
    description: "이메일 또는 비밀번호가 올바르지 않음",
  })
  async loginMobile(@Body() input: LoginRequestDto, @Req() request: Request) {
    const deviceIdHeader = request.headers["x-device-id"];

    const deviceId = Array.isArray(deviceIdHeader)
      ? deviceIdHeader[0]
      : deviceIdHeader;

    return this.authService.loginMobile({
      ...input,
      deviceId,
      userAgent: request.get("user-agent") ?? undefined,
      ipAddress: request.ip,
    });
  }

  @Public()
  @Post("mobile/apple")
  @ApiOperation({
    summary: "모바일 Apple 로그인",
  })
  @ApiOkResponse({
    description: "Apple identity token 검증 후 모바일 토큰 발급",
  })
  @ApiUnauthorizedResponse({
    description: "Apple identity token이 유효하지 않음",
  })
  async loginMobileWithApple(
    @Body() input: MobileAppleLoginRequestDto,
    @Req() request: Request,
  ) {
    const appleUser = await this.appleAuthService.verifyMobileIdentityToken(
      input.identityToken,
    );
    const deviceIdHeader = request.headers["x-device-id"];
    const deviceId = Array.isArray(deviceIdHeader)
      ? deviceIdHeader[0]
      : (input.deviceId ?? deviceIdHeader);

    return this.authService.loginMobileWithApple({
      ...appleUser,
      deviceId,
      userAgent: request.get("user-agent") ?? undefined,
      ipAddress: request.ip,
    });
  }

  @Public()
  @Post("mobile/google")
  @ApiOperation({
    summary: "모바일 Google 로그인",
    description:
      "Google ID token 검증 후 기존 회원은 로그인하고 신규 회원은 가입 티켓을 발급",
  })
  @ApiOkResponse({
    description: "Google 인증 성공 또는 약관 동의용 가입 티켓 발급",
  })
  @ApiUnauthorizedResponse({
    description: "Google identity token이 유효하지 않음",
  })
  async loginMobileWithGoogle(
    @Body() input: MobileGoogleLoginRequestDto,
    @Req() request: Request,
  ) {
    const googleUser = await this.googleAuthService.verifyMobileIdentityToken(
      input.identityToken,
    );
    const deviceIdHeader = request.headers["x-device-id"];
    const deviceId = Array.isArray(deviceIdHeader)
      ? deviceIdHeader[0]
      : (input.deviceId ?? deviceIdHeader);

    return this.authService.loginMobileWithGoogle({
      ...googleUser,
      deviceId,
      userAgent: request.get("user-agent") ?? undefined,
      ipAddress: request.ip,
    });
  }

  @Public()
  @Get("mobile/naver/start")
  @ApiOperation({
    summary: "모바일 Naver 로그인 시작",
    description: "모바일 앱이 전달한 state로 Naver 인증 URL을 생성",
  })
  @ApiOkResponse({
    description: "Naver 인증 URL 반환",
  })
  startMobileNaverLogin(@Query() input: MobileNaverStartRequestDto) {
    return this.naverAuthService.createMobileAuthorizationRequest(input.state);
  }

  @Public()
  @Get("mobile/naver/callback")
  @ApiOperation({
    summary: "모바일 Naver 로그인 Callback",
    description: "Naver 인증 결과를 모바일 앱 딥링크로 전달",
  })
  async mobileNaverCallback(
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const deepLink = new URL("cinemo://oauth/naver");

    for (const key of [
      "code",
      "state",
      "error",
      "error_description",
    ] as const) {
      const value = request.query[key];

      if (typeof value === "string") {
        deepLink.searchParams.set(key, value);
      }
    }

    return response.redirect(302, deepLink.toString());
  }

  @Public()
  @Post("mobile/naver/exchange")
  @ApiOperation({
    summary: "모바일 Naver 인증 코드 교환",
    description: "Naver 인증 코드를 검증하고 모바일 토큰을 발급",
  })
  @ApiOkResponse({
    description: "Naver 인증 성공 또는 가입 티켓 발급",
  })
  async exchangeMobileNaverCode(
    @Body() input: MobileNaverExchangeRequestDto,
    @Req() request: Request,
  ) {
    const naverUser = await this.naverAuthService.completeMobileLogin({
      code: input.code,
      state: input.state,
    });

    const deviceIdHeader = request.headers["x-device-id"];
    const deviceId = Array.isArray(deviceIdHeader)
      ? deviceIdHeader[0]
      : (input.deviceId ?? deviceIdHeader);

    return this.authService.loginMobileWithNaver({
      ...naverUser,
      deviceId,
      userAgent: request.get("user-agent") ?? undefined,
      ipAddress: request.ip,
    });
  }

  @Public()
  @Get("naver")
  @ApiOperation({
    summary: "네이버 로그인 시작",
  })
  naverLogin(@Res() response: Response) {
    const { authorizationUrl, state } =
      this.naverAuthService.createAuthorizationRequest();

    const isProduction = process.env.NODE_ENV === "production";

    response.cookie("naver_oauth_state", state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 10 * 60 * 1000,
      path: "/",
    });

    return response.redirect(302, authorizationUrl);
  }

  @Public()
  @Get("google")
  @ApiOperation({
    summary: "Google 로그인 시작",
  })
  googleLogin(@Res() response: Response) {
    const { authorizationUrl, state } =
      this.googleAuthService.createAuthorizationRequest();

    response.cookie("google_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
      path: "/",
    });

    return response.redirect(302, authorizationUrl);
  }

  @Public()
  @Get("google/callback")
  @ApiOperation({
    summary: "Google 로그인 Callback",
  })
  async googleCallback(@Req() request: Request, @Res() response: Response) {
    const googleUser = await this.googleAuthService.completeLogin({
      code: request.query.code,
      state: request.query.state,
      error: request.query.error,
      savedState: request.cookies?.google_oauth_state,
    });

    const result = await this.authService.loginWithGoogle(googleUser);
    const frontendUrl =
      this.configService.getOrThrow<string>("app.frontendUrl");

    response.clearCookie("google_oauth_state", {
      path: "/",
    });

    if (result.requiresRegistration) {
      return response.redirect(
        302,
        `${frontendUrl}/oauth-register?oauth=google&ticket=${encodeURIComponent(
          result.signupToken,
        )}`,
      );
    }

    response.cookie(SESSION_COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    return response.redirect(302, `${frontendUrl}/lobby`);
  }

  @Public()
  @Get("naver/callback")
  @ApiOperation({
    summary: "네이버 로그인 Callback",
  })
  async naverCallback(@Req() request: Request, @Res() response: Response) {
    const naverUser = await this.naverAuthService.completeLogin({
      code: request.query.code,
      state: request.query.state,
      error: request.query.error,
      savedState: request.cookies?.naver_oauth_state,
    });

    const result = await this.authService.loginWithNaver(naverUser);

    const frontendUrl =
      this.configService.getOrThrow<string>("app.frontendUrl");

    response.clearCookie("naver_oauth_state", {
      path: "/",
    });

    if (result.requiresRegistration) {
      return response.redirect(
        302,
        `${frontendUrl}/oauth-register?oauth=naver&ticket=${encodeURIComponent(
          result.signupToken,
        )}`,
      );
    }

    response.cookie(SESSION_COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    return response.redirect(302, `${frontendUrl}/lobby`);
  }

  @Public()
  @Post("mobile/oauth/signup")
  @ApiOperation({
    summary: "모바일 소셜 로그인 약관 동의 후 가입 완료",
  })
  @ApiCreatedResponse({
    description: "모바일 Access Token과 Refresh Token 발급",
  })
  async completeMobileOauthSignup(
    @Body() input: MobileOauthSignupRequestDto,
    @Req() request: Request,
  ) {
    const deviceIdHeader = request.headers["x-device-id"];

    const deviceId = Array.isArray(deviceIdHeader)
      ? deviceIdHeader[0]
      : (input.deviceId ?? deviceIdHeader);

    return this.authService.completeMobileOauthSignup({
      ...input,
      deviceId,
      userAgent: request.get("user-agent") ?? undefined,
      ipAddress: request.ip,
    });
  }

  @Public()
  @Post("mobile/refresh")
  @ApiOperation({
    summary: "모바일 Access Token 갱신",
  })
  @ApiOkResponse({
    description: "새 Access Token과 Refresh Token 발급",
  })
  @ApiUnauthorizedResponse({
    description: "Refresh Token이 유효하지 않음",
  })
  async refreshMobileTokens(
    @Body() input: MobileRefreshRequestDto,
    @Req() request: Request,
  ) {
    return this.authService.refreshMobileTokens({
      refreshToken: input.refreshToken,
      deviceId: input.deviceId ?? request.get("x-device-id") ?? undefined,
      userAgent: request.get("user-agent") ?? undefined,
      ipAddress: request.ip,
    });
  }

  @Public()
  @Post("mobile/logout")
  @ApiOperation({
    summary: "모바일 로그아웃",
  })
  @ApiOkResponse({
    description: "모바일 토큰 폐기 성공",
  })
  async logoutMobile(
    @Req() request: Request,
    @Body() input: MobileRefreshRequestDto,
  ) {
    const authorization = request.header("authorization");

    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : undefined;

    return this.authService.logoutMobile({
      accessToken,
      refreshToken: input.refreshToken,
    });
  }

  @Public()
  @Post("login")
  @ApiOperation({
    summary: "이메일 로그인",
  })
  @ApiOkResponse({
    description: "로그인 성공",
  })
  @ApiUnauthorizedResponse({
    description: "이메일 또는 비밀번호가 올바르지 않음",
  })
  async login(
    @Body() input: LoginRequestDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(input);

    response.cookie(SESSION_COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    return {
      user: result.user,
      sessionExpiresAt: result.sessionExpiresAt,
    };
  }

  @Public()
  @Post("logout")
  @ApiOperation({
    summary: "로그아웃",
  })
  @ApiOkResponse({
    description: "로그아웃 성공",
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const sessionToken = request.cookies?.[SESSION_COOKIE_NAME];

    await this.authService.logout(sessionToken);

    response.clearCookie(SESSION_COOKIE_NAME, {
      path: "/",
    });

    return {
      loggedOut: true,
    };
  }

  @ApiCookieAuth("cinemo_session")
  @Delete("me")
  @ApiOperation({
    summary: "회원 탈퇴",
  })
  @ApiOkResponse({
    description: "회원 탈퇴 성공",
  })
  async deleteAccount(
    @CurrentUser() user: SessionUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.deleteAccount(user.id);

    response.clearCookie(SESSION_COOKIE_NAME, {
      path: "/",
    });

    return {
      deleted: true,
    };
  }

  @Public()
  @Get("apple")
  @ApiOperation({
    summary: "Apple 로그인 시작",
  })
  appleLogin(@Res() response: Response) {
    const { authorizationUrl, state, nonce } =
      this.appleAuthService.createAuthorizationRequest();

    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      maxAge: 10 * 60 * 1000,
      path: "/",
    };

    response.cookie("apple_oauth_state", state, cookieOptions);
    response.cookie("apple_oauth_nonce", nonce, cookieOptions);

    return response.redirect(302, authorizationUrl);
  }

  @Public()
  @Post("apple/callback")
  @ApiOperation({
    summary: "Apple 로그인 콜백",
  })
  async appleCallback(@Req() request: Request, @Res() response: Response) {
    const result = await this.appleAuthService.completeLogin({
      ...(request.body as {
        code?: string;
        state?: string;
        error?: string;
      }),
      savedState: request.cookies?.apple_oauth_state,
      savedNonce: request.cookies?.apple_oauth_nonce,
    });

    const frontendUrl =
      this.configService.getOrThrow<string>("app.frontendUrl");

    if (result.requiresRegistration) {
      return response.redirect(
        302,
        `${frontendUrl}/oauth-register?oauth=apple&ticket=${encodeURIComponent(
          result.signupToken,
        )}`,
      );
    }

    const isProduction = process.env.NODE_ENV === "production";

    response.cookie(SESSION_COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    response.clearCookie("apple_oauth_state", {
      path: "/",
    });

    response.clearCookie("apple_oauth_nonce", {
      path: "/",
    });

    return response.redirect(302, `${frontendUrl}/lobby`);
  }

  @Public()
  @Post("oauth/register")
  @ApiOperation({
    summary: "OAuth 회원가입 완료",
    description: "OAuth 가입 티켓과 닉네임·약관 동의로 회원가입 완료",
  })
  async registerWithOauth(
    @Body() input: OauthSignupRequestDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.completeOauthSignup(input);

    response.cookie(SESSION_COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    return {
      user: result.user,
      sessionExpiresAt: result.sessionExpiresAt,
    };
  }
}
