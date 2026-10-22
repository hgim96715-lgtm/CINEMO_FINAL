import { BadRequestException, Injectable } from "@nestjs/common";
import { EmailVerificationPurpose } from "@prisma/client";
import { createHash } from "node:crypto";

import { AuthRepository } from "./auth.repository";

@Injectable()
export class EmailVerificationService {
  constructor(private readonly authRepository: AuthRepository) {}

  async verify(token: string) {
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const verification = await this.authRepository.findEmailVerification(
      tokenHash,
    );

    if (
      !verification ||
      verification.purpose !== EmailVerificationPurpose.SIGNUP ||
      verification.verifiedAt ||
      verification.expiresAt <= new Date()
    ) {
      throw new BadRequestException("유효하지 않거나 만료된 인증 링크입니다.");
    }

    const verifiedAt = new Date();

    const verified = await this.authRepository.completeEmailVerification({
      verificationId: verification.id,
      userId: verification.userId,
      verifiedAt,
    });

    if (!verified) {
      throw new BadRequestException(
        "이미 사용되었거나 만료된 인증 링크입니다.",
      );
    }

    return { verified: true, userId: verification.userId };
  }
}
