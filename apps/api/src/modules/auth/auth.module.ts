import { Module } from "@nestjs/common";

import { PasswordHasherService } from "./password-hasher.service";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { EmailVerificationService } from "./email-verification.service";
import { MailService } from "./mail.service";

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailVerificationService,
    PasswordHasherService,
    MailService,
  ],
  exports: [
    AuthService,
    EmailVerificationService,
    PasswordHasherService,
    MailService,
  ],
})
export class AuthModule {}
