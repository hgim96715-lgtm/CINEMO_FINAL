import { BadRequestException, Injectable } from "@nestjs/common";
import { EmailVerificationPurpose } from "@prisma/client";
import { createHash } from "node:crypto";

import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class EmailVerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async verify(token: string) {
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const verification = await this.prisma.emailVerification.findUnique({
      where: { tokenHash },
    });

    if (
      !verification ||
      verification.purpose !== EmailVerificationPurpose.SIGNUP ||
      verification.verifiedAt ||
      verification.expiresAt <= new Date()
    ) {
      throw new BadRequestException("유효하지 않거나 만료된 인증 링크입니다.");
    }

    const verifiedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.emailVerification.updateMany({
        where: {
          id: verification.id,
          verifiedAt: null,
          expiresAt: {
            gt: verifiedAt,
          },
        },
        data: {
          verifiedAt,
        },
      });

      if (result.count !== 1) {
        throw new BadRequestException(
          "이미 사용되었거나 만료된 인증 링크입니다.",
        );
      }

      await tx.userPasswordCredential.update({
        where: {
          userId: verification.userId,
        },
        data: {
          emailVerifiedAt: verifiedAt,
        },
      });

      return {
        verified: true,
        userId: verification.userId,
      };
    });
  }
}
