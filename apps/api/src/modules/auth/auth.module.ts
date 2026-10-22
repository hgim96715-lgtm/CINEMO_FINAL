import { Module } from "@nestjs/common";

import { PasswordHasherService } from "./password-hasher.service";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { EmailVerificationService } from "./email-verification.service";
import { MailService } from "./mail.service";
import { PasswordResetService } from "./password-reset.service";
import { AppleAuthService } from "./apple-auth.service";
import { AuthRepository } from "./auth.repository";
import { GoogleAuthService } from "./google-auth.service";
import { NaverAuthService } from "@/modules/auth/naver-auth.service";

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    EmailVerificationService,
    PasswordHasherService,
    MailService,
    PasswordResetService,
    AppleAuthService,
    GoogleAuthService,
    NaverAuthService,
  ],
  exports: [
    AuthService,
    AuthRepository,
    EmailVerificationService,
    PasswordHasherService,
    MailService,
    PasswordResetService,
    AppleAuthService,
    GoogleAuthService,
    NaverAuthService,
  ],
})
export class AuthModule {}
