import { Module } from "@nestjs/common";

import { PasswordHasherService } from "./password-hasher.service";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { EmailVerificationService } from "./email-verification.service";
import { MailService } from "./mail.service";
import { PasswordResetService } from "./password-reset.service";
import { AppleAuthService } from "./apple-auth.service";

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailVerificationService,
    PasswordHasherService,
    MailService,
    PasswordResetService,
    AppleAuthService,
  ],
  exports: [
    AuthService,
    EmailVerificationService,
    PasswordHasherService,
    MailService,
    PasswordResetService,
    AppleAuthService,
  ],
})
export class AuthModule {}
