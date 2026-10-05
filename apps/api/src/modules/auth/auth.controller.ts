import { Body, Controller, Get, Post, Query, Req, Res } from "@nestjs/common";

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

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
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
  verifyEmail(@Query() params: VerifyEmailRequestDto) {
    return this.emailVerificationService.verify(params.token);
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
}
