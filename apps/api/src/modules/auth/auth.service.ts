import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import {
  EmailVerificationPurpose,
  AuthProvider,
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
const OAUTH_SIGNUP_TICKET_EXPIRES_IN_MS = 10 * 60 * 1000;

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

  async loginWithApple(input: {
    providerUserId: string;
    email: string | null;
    emailVerified: boolean;
  }) {
    if (!input.email || !input.emailVerified) {
      throw new UnauthorizedException("Apple 이메일 인증 정보가 필요합니다.");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const existingIdentity = await tx.userIdentity.findUnique({
        where: {
          provider_providerUserId: {
            provider: AuthProvider.APPLE,
            providerUserId: input.providerUserId,
          },
        },
        include: {
          user: true,
        },
      });

      if (existingIdentity) {
        return {
          type: "login" as const,
          user: existingIdentity.user,
        };
      }

      const existingUser = await tx.user.findUnique({
        where: {
          email: input.email!,
        },
      });

      if (!existingUser) {
        const signupToken = randomBytes(32).toString("base64url");
        const tokenHash = createHash("sha256")
          .update(signupToken)
          .digest("hex");

        await tx.oauthSignupTicket.create({
          data: {
            tokenHash,
            provider: AuthProvider.APPLE,
            providerUserId: input.providerUserId,
            providerEmail: input.email,
            expiresAt: new Date(
              Date.now() + OAUTH_SIGNUP_TICKET_EXPIRES_IN_MS,
            ),
          },
        });

        return {
          type: "signup" as const,
          signupToken,
        };
      }

      await tx.userIdentity.upsert({
        where: {
          provider_providerUserId: {
            provider: AuthProvider.APPLE,
            providerUserId: input.providerUserId,
          },
        },
        update: {
          providerEmail: input.email,
        },
        create: {
          userId: existingUser.id,
          provider: AuthProvider.APPLE,
          providerUserId: input.providerUserId,
          providerEmail: input.email,
        },
      });

      return {
        type: "login" as const,
        user: existingUser,
      };
    });

    if (result.type === "signup") {
      return {
        requiresRegistration: true as const,
        signupToken: result.signupToken,
      };
    }

    const user = result.user;

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("로그인할 수 없는 계정입니다.");
    }

    const sessionToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

    const expiresAt = new Date(Date.now() + SESSION_EXPIRES_IN_MS);

    await this.prisma.authSession.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
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
      sessionExpiresAt: expiresAt,
    };
  }

  async completeOauthSignup(input: {
    ticket: string;
    nickname: string;
    terms: {
      service: boolean;
      privacy: boolean;
      marketing?: boolean;
    };
  }) {
    const nickname = normalizeNickname(input.nickname);
    const nicknameError = validateNickname(nickname);

    if (nicknameError) {
      throw new BadRequestException(nicknameError);
    }

    const tokenHash = createHash("sha256")
      .update(input.ticket)
      .digest("hex");

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.oauthSignupTicket.findUnique({
        where: { tokenHash },
      });

      if (
        !ticket ||
        ticket.consumedAt ||
        ticket.expiresAt <= new Date()
      ) {
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

      const existingEmail = ticket.providerEmail
        ? await tx.user.findUnique({
            where: { email: ticket.providerEmail },
            select: { id: true },
          })
        : null;

      if (existingEmail) {
        throw new ConflictException("이미 가입된 이메일입니다.");
      }

      const existingNickname = await tx.user.findUnique({
        where: { nickname },
        select: { id: true },
      });

      if (existingNickname) {
        throw new ConflictException("이미 사용 중인 닉네임입니다.");
      }

      const user = await tx.user.create({
        data: {
          email: ticket.providerEmail,
          nickname,
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
          profileImageUrl: true,
        },
      });

      await tx.oauthSignupTicket.update({
        where: { id: ticket.id },
        data: { consumedAt: new Date() },
      });

      const sessionToken = randomBytes(32).toString("base64url");
      const sessionTokenHash = createHash("sha256")
        .update(sessionToken)
        .digest("hex");
      const sessionExpiresAt = new Date(
        Date.now() + SESSION_EXPIRES_IN_MS,
      );

      await tx.authSession.create({
        data: {
          userId: user.id,
          tokenHash: sessionTokenHash,
          expiresAt: sessionExpiresAt,
        },
      });

      return {
        user,
        sessionToken,
        sessionExpiresAt,
      };
    });
  }
}
