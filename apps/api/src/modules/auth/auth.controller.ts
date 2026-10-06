import {
  Body,
  Controller,
  Delete,
  Get,
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
import { Throttle } from "@nestjs/throttler";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordResetService: PasswordResetService,
    private readonly configService: ConfigService,
  ) {}

  @ApiCookieAuth("cinemo_session")
  @Get("me")
  getMe(@CurrentUser() user: SessionUser) {
    return user;
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

    const frontendUrl = this.configService.getOrThrow<string>(
      "app.frontendUrl",
    );

    return response.redirect(302, `${frontendUrl}/login?verified=true`);
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

    response.cookie("cinemo_session", result.sessionToken, {
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
    const sessionToken = request.cookies?.cinemo_session;

    await this.authService.logout(sessionToken);

    response.clearCookie("cinemo_session", {
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

    response.clearCookie("cinemo_session", {
      path: "/",
    });

    return {
      deleted: true,
    };
  }
}
