import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import {
  EmailVerificationPurpose,
  TermsType,
  UserStatus,
} from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

import { PrismaService } from "@/prisma/prisma.service";

import { RegisterRequestDto } from "./dto/requests/register.request.dto";
import { PasswordHasherService } from "./password-hasher.service";
import { LoginRequestDto } from "./dto/requests/login.request.dto";
import { MailService } from "./mail.service";
import { normalizeNickname, validateNickname } from "./nickname.policy";

const CURRENT_TERMS_VERSION = "1.0.0";
const EMAIL_VERIFICATION_EXPIRES_IN_MS = 30 * 60 * 1000;

const SESSION_EXPIRES_IN_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly mailService: MailService,
  ) {}

  async register(input: RegisterRequestDto) {
    const email = input.email.trim().toLowerCase();
    const nickname = normalizeNickname(input.nickname);
    const nicknameError = validateNickname(nickname);

    if (nicknameError) {
      throw new BadRequestException(nicknameError);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const verificationToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRES_IN_MS);

    const user = await this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser) {
        throw new ConflictException("이미 가입된 이메일입니다.");
      }

      const existingNickname = await tx.user.findFirst({
        where: {
          nickname,
        },
        select: {
          id: true,
        },
      });
      if (existingNickname) {
        throw new ConflictException("이미 사용 중인 닉네임입니다.");
      }

      return tx.user.create({
        data: {
          email,
          nickname,

          passwordCredential: {
            create: {
              passwordHash,
            },
          },

          emailVerifications: {
            create: {
              tokenHash,
              purpose: EmailVerificationPurpose.SIGNUP,
              expiresAt,
            },
          },

          termsAgreements: {
            create: [
              {
                termsType: TermsType.SERVICE,
                version: CURRENT_TERMS_VERSION,
              },
              {
                termsType: TermsType.PRIVACY,
                version: CURRENT_TERMS_VERSION,
              },
              ...(input.terms.marketing
                ? [
                    {
                      termsType: TermsType.MARKETING,
                      version: CURRENT_TERMS_VERSION,
                    },
                  ]
                : []),
            ],
          },
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

    await this.mailService.sendSignupVerificationEmail({
      to: email,
      token: verificationToken,
      expiresAt,
    });

    return {
      user,
      emailVerificationRequired: true,
    };
  }

  async login(input: LoginRequestDto) {
    const email = input.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        passwordCredential: true,
      },
    });

    if (
      !user ||
      user.status !== UserStatus.ACTIVE ||
      !user.passwordCredential ||
      !user.passwordCredential.emailVerifiedAt
    ) {
      throw new UnauthorizedException(
        "이메일 또는 비밀번호가 올바르지 않습니다.",
      );
    }

    const isPasswordValid = await this.passwordHasher.verify(
      user.passwordCredential.passwordHash,
      input.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        "이메일 또는 비밀번호가 올바르지 않습니다.",
      );
    }

    const sessionToken = randomBytes(32).toString("base64url");

    const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

    const expiresAt = new Date(Date.now() + SESSION_EXPIRES_IN_MS);

    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        status: user.status,
        profileImageUrl: user.profileImageUrl,
      },
      sessionToken,
      sessionExpiresAt: session.expiresAt,
    };
  }

  async logout(sessionToken?: string) {
    if (!sessionToken) {
      return;
    }

    const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

    await this.prisma.authSession.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async deleteAccount(userId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.authSession.deleteMany({
        where: { userId },
      });
      await tx.user.delete({
        where: { id: userId },
      });
    });
  }

  async validateSession(sessionToken?: string) {
    if (!sessionToken) {
      throw new UnauthorizedException("로그인이 필요합니다.");
    }

    const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            status: true,
            profileImageUrl: true,
          },
        },
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException("세션이 유효하지 않습니다.");
    }

    return session.user;
  }

  async checkNickname(nicknameInput: string) {
    const nickname = normalizeNickname(nicknameInput);
    const validationMessage = validateNickname(nickname);

    if (validationMessage) {
      throw new BadRequestException(validationMessage);
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { nickname },
      select: { id: true },
    });

    return {
      available: !existingUser,
    };
  }

  async checkEmail(emailInput: string) {
    const email = emailInput.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return {
      available: !existingUser,
    };
  }
}
