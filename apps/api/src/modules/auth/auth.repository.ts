import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import {
  AuthProvider,
  EmailVerificationPurpose,
  Prisma,
  TermsType,
  UserStatus,
  UserVisibility,
} from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

const authUserSelect = {
  id: true,
  email: true,
  nickname: true,
  status: true,
  profileVisibility: true,
  isAdmin: true,
  profileImageUrl: true,
} as const;

export type AuthUser = Prisma.UserGetPayload<{
  select: typeof authUserSelect;
}>;

type TermsInput = {
  service: boolean;
  privacy: boolean;
  marketing?: boolean;
};

type MobileTokenRecordInput = {
  userId: string;
  accessTokenHash: string;
  refreshTokenHash: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
};

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createEmailSignup(input: {
    email: string;
    nickname: string;
    passwordHash: string;
    verificationTokenHash: string;
    verificationExpiresAt: Date;
    termsVersion: string;
    marketing: boolean;
  }) {
    const termsAgreements = this.buildTermsAgreements(
      input.termsVersion,
      input.marketing,
    );

    return this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: input.email },
        select: {
          id: true,
          status: true,
          passwordCredential: {
            select: { emailVerifiedAt: true },
          },
        },
      });

      if (
        existingUser &&
        (!existingUser.passwordCredential ||
          existingUser.passwordCredential.emailVerifiedAt ||
          existingUser.status !== UserStatus.ACTIVE)
      ) {
        throw new ConflictException("이미 가입된 이메일입니다.");
      }

      const existingNickname = await tx.user.findFirst({
        where: {
          nickname: input.nickname,
          ...(existingUser ? { NOT: { id: existingUser.id } } : {}),
        },
        select: { id: true },
      });

      if (existingNickname) {
        throw new ConflictException("이미 사용 중인 닉네임입니다.");
      }

      if (existingUser) {
        return tx.user.update({
          where: { id: existingUser.id },
          data: {
            nickname: input.nickname,
            passwordCredential: {
              update: {
                passwordHash: input.passwordHash,
                emailVerifiedAt: null,
              },
            },
            emailVerifications: {
              create: {
                tokenHash: input.verificationTokenHash,
                purpose: EmailVerificationPurpose.SIGNUP,
                expiresAt: input.verificationExpiresAt,
              },
            },
            termsAgreements: { create: termsAgreements },
          },
          select: {
            id: true,
            email: true,
            nickname: true,
            status: true,
            createdAt: true,
          },
        });
      }

      return tx.user.create({
        data: {
          email: input.email,
          nickname: input.nickname,
          passwordCredential: {
            create: { passwordHash: input.passwordHash },
          },
          emailVerifications: {
            create: {
              tokenHash: input.verificationTokenHash,
              purpose: EmailVerificationPurpose.SIGNUP,
              expiresAt: input.verificationExpiresAt,
            },
          },
          termsAgreements: { create: termsAgreements },
        },
        select: {
          id: true,
          email: true,
          nickname: true,
          status: true,
          createdAt: true,
        },
      });
    });
  }

  async findUserWithPassword(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { passwordCredential: true },
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
  }

  async findUserByNickname(nickname: string) {
    return this.prisma.user.findFirst({
      where: { nickname },
      select: { id: true },
    });
  }

  async createSession(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return this.prisma.authSession.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
      },
      select: { expiresAt: true },
    });
  }

  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async revokeSession(tokenHash: string) {
    return this.prisma.authSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeMobileTokens(input: {
    accessTokenHash?: string;
    refreshTokenHash?: string;
    revokedAt: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      if (input.accessTokenHash) {
        await tx.authSession.updateMany({
          where: { tokenHash: input.accessTokenHash, revokedAt: null },
          data: { revokedAt: input.revokedAt },
        });
      }

      if (input.refreshTokenHash) {
        await tx.mobileRefreshToken.updateMany({
          where: {
            tokenHash: input.refreshTokenHash,
            revokedAt: null,
          },
          data: {
            revokedAt: input.revokedAt,
            lastUsedAt: input.revokedAt,
          },
        });
      }
    });
  }

  async deleteAccount(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.authSession.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  }

  async updateProfileVisibility(
    userId: string,
    profileVisibility: UserVisibility,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { profileVisibility },
      select: { profileVisibility: true },
    });
  }

  async findSessionWithUser(tokenHash: string) {
    return this.prisma.authSession.findUnique({
      where: { tokenHash },
      include: { user: { select: authUserSelect } },
    });
  }

  async resolveOAuthUser(input: {
    provider: AuthProvider;
    providerUserId: string;
    email: string | null;
    emailVerified: boolean;
    signupTokenHash: string;
    signupTokenExpiresAt: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const existingIdentity = await tx.userIdentity.findUnique({
        where: {
          provider_providerUserId: {
            provider: input.provider,
            providerUserId: input.providerUserId,
          },
        },
        include: { user: true },
      });

      if (existingIdentity) {
        return { type: "login" as const, user: existingIdentity.user };
      }

      if (!input.email || !input.emailVerified) {
        throw new UnauthorizedException("OAuth 이메일 인증 정보가 필요합니다.");
      }

      const existingUser = await tx.user.findUnique({
        where: { email: input.email },
      });

      if (!existingUser) {
        await tx.oauthSignupTicket.create({
          data: {
            tokenHash: input.signupTokenHash,
            provider: input.provider,
            providerUserId: input.providerUserId,
            providerEmail: input.email,
            expiresAt: input.signupTokenExpiresAt,
          },
        });

        return { type: "signup" as const };
      }

      await tx.userIdentity.upsert({
        where: {
          provider_providerUserId: {
            provider: input.provider,
            providerUserId: input.providerUserId,
          },
        },
        update: { providerEmail: input.email },
        create: {
          userId: existingUser.id,
          provider: input.provider,
          providerUserId: input.providerUserId,
          providerEmail: input.email,
        },
      });

      return { type: "login" as const, user: existingUser };
    });
  }

  async createOauthUser(input: {
    ticketHash: string;
    nickname: string;
    termsVersion: string;
    marketing: boolean;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.oauthSignupTicket.findUnique({
        where: { tokenHash: input.ticketHash },
      });

      if (!ticket || ticket.consumedAt || ticket.expiresAt <= new Date()) {
        throw new BadRequestException(
          "OAuth 가입 티켓이 만료되었거나 유효하지 않습니다.",
        );
      }

      const existingIdentity = await tx.userIdentity.findUnique({
        where: {
          provider_providerUserId: {
            provider: ticket.provider,
            providerUserId: ticket.providerUserId,
          },
        },
        select: { id: true },
      });

      if (existingIdentity) {
        throw new ConflictException("이미 연결된 계정입니다.");
      }

      if (ticket.providerEmail) {
        const existingEmail = await tx.user.findUnique({
          where: { email: ticket.providerEmail },
          select: { id: true },
        });

        if (existingEmail) {
          throw new ConflictException("이미 가입된 이메일입니다.");
        }
      }

      const existingNickname = await tx.user.findUnique({
        where: { nickname: input.nickname },
        select: { id: true },
      });

      if (existingNickname) {
        throw new ConflictException("이미 사용 중인 닉네임입니다.");
      }

      const user = await tx.user.create({
        data: {
          email: ticket.providerEmail,
          nickname: input.nickname,
          lastLoginAt: new Date(),
          identities: {
            create: {
              provider: ticket.provider,
              providerUserId: ticket.providerUserId,
              providerEmail: ticket.providerEmail,
              providerImageUrl: ticket.providerImageUrl,
            },
          },
          termsAgreements: {
            create: this.buildTermsAgreements(
              input.termsVersion,
              input.marketing,
            ),
          },
        },
        select: authUserSelect,
      });

      await tx.oauthSignupTicket.update({
        where: { id: ticket.id },
        data: { consumedAt: new Date() },
      });

      return user;
    });
  }

  async findMobileRefreshToken(tokenHash: string) {
    return this.prisma.mobileRefreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, status: true } } },
    });
  }

  async rotateMobileRefreshToken(input: {
    currentTokenId: string;
    userId: string;
    currentExpiresAt: Date;
    now: Date;
    accessTokenHash: string;
    refreshTokenHash: string;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
    deviceId?: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const revoked = await tx.mobileRefreshToken.updateMany({
        where: {
          id: input.currentTokenId,
          revokedAt: null,
          expiresAt: { gt: input.now },
        },
        data: {
          revokedAt: input.now,
          lastUsedAt: input.now,
        },
      });

      if (revoked.count !== 1) {
        return false;
      }

      await tx.authSession.create({
        data: {
          userId: input.userId,
          tokenHash: input.accessTokenHash,
          expiresAt: input.accessTokenExpiresAt,
          userAgent: input.userAgent ?? null,
          ipAddress: input.ipAddress ?? null,
        },
      });

      await tx.mobileRefreshToken.create({
        data: {
          userId: input.userId,
          tokenHash: input.refreshTokenHash,
          deviceId: input.deviceId ?? null,
          userAgent: input.userAgent ?? null,
          ipAddress: input.ipAddress ?? null,
          expiresAt: input.refreshTokenExpiresAt,
        },
      });

      return true;
    });
  }

  async createMobileTokenRecords(input: MobileTokenRecordInput) {
    return this.prisma.$transaction([
      this.prisma.authSession.create({
        data: {
          userId: input.userId,
          tokenHash: input.accessTokenHash,
          expiresAt: input.accessTokenExpiresAt,
          userAgent: input.userAgent ?? null,
          ipAddress: input.ipAddress ?? null,
        },
      }),
      this.prisma.mobileRefreshToken.create({
        data: {
          userId: input.userId,
          tokenHash: input.refreshTokenHash,
          deviceId: input.deviceId ?? null,
          userAgent: input.userAgent ?? null,
          ipAddress: input.ipAddress ?? null,
          expiresAt: input.refreshTokenExpiresAt,
        },
      }),
    ]);
  }

  async findEmailVerification(tokenHash: string) {
    return this.prisma.emailVerification.findUnique({
      where: { tokenHash },
    });
  }

  async completeEmailVerification(input: {
    verificationId: string;
    userId: string;
    verifiedAt: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.emailVerification.updateMany({
        where: {
          id: input.verificationId,
          verifiedAt: null,
          expiresAt: { gt: input.verifiedAt },
        },
        data: { verifiedAt: input.verifiedAt },
      });

      if (result.count !== 1) {
        return false;
      }

      await tx.userPasswordCredential.update({
        where: { userId: input.userId },
        data: { emailVerifiedAt: input.verifiedAt },
      });

      return true;
    });
  }

  async createPasswordResetToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({
        where: { userId: input.userId, usedAt: null },
      });

      return tx.passwordResetToken.create({
        data: {
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
        },
      });
    });
  }

  async findPasswordResetToken(tokenHash: string) {
    return this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        usedAt: true,
        expiresAt: true,
        user: {
          select: {
            passwordCredential: { select: { id: true } },
          },
        },
      },
    });
  }

  async completePasswordReset(input: {
    tokenId: string;
    userId: string;
    passwordHash: string;
    now: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.passwordResetToken.updateMany({
        where: {
          id: input.tokenId,
          usedAt: null,
          expiresAt: { gt: input.now },
        },
        data: { usedAt: input.now },
      });

      if (result.count !== 1) {
        return false;
      }

      await tx.userPasswordCredential.update({
        where: { userId: input.userId },
        data: { passwordHash: input.passwordHash },
      });

      await tx.authSession.updateMany({
        where: { userId: input.userId, revokedAt: null },
        data: { revokedAt: input.now },
      });

      return true;
    });
  }

  private buildTermsAgreements(version: string, marketing: boolean) {
    return [
      { termsType: TermsType.SERVICE, version },
      { termsType: TermsType.PRIVACY, version },
      ...(marketing ? [{ termsType: TermsType.MARKETING, version }] : []),
    ];
  }
}
