import { Module } from "@nestjs/common";

import { PasswordHasherService } from "./password-hasher.service";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { EmailVerificationService } from "./email-verification.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, EmailVerificationService, PasswordHasherService],
  exports: [AuthService, EmailVerificationService, PasswordHasherService],
})
export class AuthModule {}
