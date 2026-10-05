import { BadRequestException, Injectable } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";

import { PrismaService } from "@/prisma/prisma.service";

import { MailService } from "./mail.service";
import { RequestPasswordResetRequestDto } from "./dto/requests/request-password-reset.request.dto";
import { PasswordHasherService } from "./password-hasher.service";
import { ResetPasswordRequestDto } from "./dto/requests/reset-password.request.dto";

const PASSWORD_RESET_EXPIRES_IN_MS = 30 * 60 * 1000;

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly passwordHasher: PasswordHasherService,
  ) {}

  async request(input: RequestPasswordResetRequestDto) {
    const email = input.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
      },
    });

    // 가입 여부를 외부에 노출하지 않음
    if (!user?.email) {
      return {
        accepted: true,
      };
    }

    const token = randomBytes(32).toString("base64url");

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRES_IN_MS);

    await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
      });

      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });
    });

    await this.mailService.sendPasswordResetEmail({
      to: user.email,
      token,
      expiresAt,
    });

    return {
      accepted: true,
    };
  }

  async reset(input: ResetPasswordRequestDto) {
    const tokenHash = createHash("sha256").update(input.token).digest("hex");

    const now = new Date();

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        usedAt: true,
        expiresAt: true,
        user: {
          select: {
            passwordCredential: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= now ||
      !resetToken.user.passwordCredential
    ) {
      throw new BadRequestException(
        "유효하지 않거나 만료된 비밀번호 재설정 링크입니다.",
      );
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          usedAt: now,
        },
      });

      if (result.count !== 1) {
        throw new BadRequestException(
          "이미 사용되었거나 만료된 비밀번호 재설정 링크입니다.",
        );
      }

      await tx.userPasswordCredential.update({
        where: {
          userId: resetToken.userId,
        },
        data: {
          passwordHash,
        },
      });

      await tx.authSession.updateMany({
        where: {
          userId: resetToken.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });
    });

    return {
      reset: true,
    };
  }
}
