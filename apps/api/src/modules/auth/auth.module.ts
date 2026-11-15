import { Module } from "@nestjs/common";

import { PasswordHasherService } from "./services/password-hasher.service";
import { AuthService } from "./services/auth.service";
import { AuthController } from "./controllers/auth.controller";
import { EmailVerificationService } from "./services/email-verification.service";
import { MailService } from "./services/mail.service";
import { PasswordResetService } from "./services/password-reset.service";
import { AppleAuthService } from "./services/apple-auth.service";
import { AuthRepository } from "./repositories/auth.repository";
import { GoogleAuthService } from "./services/google-auth.service";
import { NaverAuthService } from "@/modules/auth/services/naver-auth.service";
import { ActivityModule } from "@/modules/activity/activity.module";

@Module({
  imports: [ActivityModule],
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
