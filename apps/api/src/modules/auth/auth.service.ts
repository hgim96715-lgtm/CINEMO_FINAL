import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthProvider, UserStatus, UserVisibility } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

import { RegisterRequestDto } from "./dto/requests/register.request.dto";
import { PasswordHasherService } from "./password-hasher.service";
import { LoginRequestDto } from "./dto/requests/login.request.dto";
import { MailService } from "./mail.service";
import { normalizeNickname, validateNickname } from "./nickname.policy";
import { MobileOauthSignupRequestDto } from "@/modules/auth/dto/requests/mobile-oauth-signup.request.dto";
import { AuthRepository } from "./auth.repository";
import { ActivityService } from "@/modules/activity/activity.service";
import { UserActivityType } from "@prisma/client";

const CURRENT_TERMS_VERSION = "1.0.0";
const EMAIL_VERIFICATION_EXPIRES_IN_MS = 30 * 60 * 1000;

const SESSION_EXPIRES_IN_MS = 24 * 60 * 60 * 1000;
const OAUTH_SIGNUP_TICKET_EXPIRES_IN_MS = 10 * 60 * 1000;

const MOBILE_ACCESS_TOKEN_EXPIRES_IN_MS = 15 * 60 * 1000;
const MOBILE_REFRESH_TOKEN_EXPIRES_IN_MS = 30 * 24 * 60 * 60 * 1000;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

type MobileTokenPair = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
};

type MobileTokenContext = {
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
};

type IssueMobileTokensInput = MobileTokenContext & {
  userId: string;
};

type RefreshMobileTokensInput = MobileTokenContext & {
  refreshToken: string;
};

type MobileLogoutInput = {
  accessToken?: string;
  refreshToken?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordHasher: PasswordHasherService,
    private readonly mailService: MailService,
    private readonly activityService: ActivityService,
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
    const user = await this.authRepository.createEmailSignup({
      email,
      nickname,
      passwordHash,
      verificationTokenHash: tokenHash,
      verificationExpiresAt: expiresAt,
      termsVersion: CURRENT_TERMS_VERSION,
      marketing: input.terms.marketing,
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

  async login(input: LoginRequestDto, adminOnly = false) {
    const email = normalizeEmail(input.email);

    const user = await this.authRepository.findUserWithPassword(email);

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

    if (adminOnly && !user.isAdmin) {
      throw new UnauthorizedException("관리자 계정만 로그인할 수 있습니다.");
    }

    const sessionToken = randomBytes(32).toString("base64url");

    const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

    const expiresAt = new Date(Date.now() + SESSION_EXPIRES_IN_MS);

    const session = await this.authRepository.createSession({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await this.authRepository.updateLastLogin(user.id);
    this.recordLogin(user.id, "EMAIL");

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        status: user.status,
        profileVisibility: user.profileVisibility,
        isAdmin: user.isAdmin,
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

    const session = await this.authRepository.findSessionWithUser(tokenHash);

    await this.authRepository.revokeSession(tokenHash);

    if (session) {
      void this.activityService.record({
        userId: session.user.id,
        type: UserActivityType.LOGOUT,
      });
    }
  }

  async logoutMobile(input: MobileLogoutInput) {
    const revokedAt = new Date();

    await this.authRepository.revokeMobileTokens({
      accessTokenHash: input.accessToken
        ? createHash("sha256").update(input.accessToken).digest("hex")
        : undefined,
      refreshTokenHash: input.refreshToken
        ? createHash("sha256").update(input.refreshToken).digest("hex")
        : undefined,
      revokedAt,
    });

    return {
      loggedOut: true,
    };
  }

  async deleteAccount(userId: string) {
    await this.authRepository.deleteAccount(userId);
  }

  async updateProfileVisibility(
    userId: string,
    profileVisibility: UserVisibility,
  ) {
    return this.authRepository.updateProfileVisibility(
      userId,
      profileVisibility,
    );
  }

  async validateSession(sessionToken?: string) {
    if (!sessionToken) {
      throw new UnauthorizedException("로그인이 필요합니다.");
    }

    const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

    const session = await this.authRepository.findSessionWithUser(tokenHash);

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

    const existingUser = await this.authRepository.findUserByNickname(nickname);

    return {
      available: !existingUser,
    };
  }

  async checkEmail(emailInput: string) {
    const email = normalizeEmail(emailInput);

    const existingUser = await this.authRepository.findUserByEmail(email);

    return {
      available: !existingUser,
    };
  }

  async loginWithApple(input: {
    providerUserId: string;
    email: string | null;
    emailVerified: boolean;
  }) {
    const result = await this.resolveOAuthUser({
      ...input,
      provider: AuthProvider.APPLE,
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

    await this.authRepository.createSession({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await this.authRepository.updateLastLogin(user.id);
    this.recordLogin(user.id, "APPLE");

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        status: user.status,
        profileVisibility: user.profileVisibility,
        isAdmin: user.isAdmin,
        profileImageUrl: user.profileImageUrl,
      },
      sessionToken,
      sessionExpiresAt: expiresAt,
    };
  }

  async loginWithNaver(input: {
    providerUserId: string;
    email: string | null;
    emailVerified: boolean;
  }) {
    const result = await this.resolveOAuthUser({
      ...input,
      provider: AuthProvider.NAVER,
    });
    if (result.type === "signup") {
      return {
        requiresRegistration: true as const,
        signupToken: result.signupToken,
      };
    }
    const user = result.user;
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("로그인 할 수 없는 계정입니다.");
    }
    const sessionToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(sessionToken).digest("hex");
    const sessionExpiresAt = new Date(Date.now() + SESSION_EXPIRES_IN_MS);

    await this.authRepository.createSession({
      userId: user.id,
      tokenHash,
      expiresAt: sessionExpiresAt,
    });
    await this.authRepository.updateLastLogin(user.id);
    this.recordLogin(user.id, "NAVER");
    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        status: user.status,
        profileVisibility: user.profileVisibility,
        isAdmin: user.isAdmin,
        profileImageUrl: user.profileImageUrl,
      },
      sessionToken,
      sessionExpiresAt,
    };
  }

  async loginWithGoogle(input: {
    providerUserId: string;
    email: string | null;
    emailVerified: boolean;
  }) {
    const result = await this.resolveOAuthUser({
      ...input,
      provider: AuthProvider.GOOGLE,
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
    const sessionExpiresAt = new Date(Date.now() + SESSION_EXPIRES_IN_MS);

    await this.authRepository.createSession({
      userId: user.id,
      tokenHash,
      expiresAt: sessionExpiresAt,
    });
    await this.authRepository.updateLastLogin(user.id);
    this.recordLogin(user.id, "GOOGLE");

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        status: user.status,
        profileVisibility: user.profileVisibility,
        isAdmin: user.isAdmin,
        profileImageUrl: user.profileImageUrl,
      },
      sessionToken,
      sessionExpiresAt,
    };
  }

  async loginMobileWithApple(
    input: {
      providerUserId: string;
      email: string | null;
      emailVerified: boolean;
    } & MobileTokenContext,
  ) {
    const result = await this.resolveOAuthUser({
      ...input,
      provider: AuthProvider.APPLE,
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

    const tokens = await this.issueMobileTokens({
      userId: user.id,
      deviceId: input.deviceId,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    await this.authRepository.updateLastLogin(user.id);
    this.recordLogin(user.id, "APPLE_MOBILE");

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        status: user.status,
        profileVisibility: user.profileVisibility,
        isAdmin: user.isAdmin,
        profileImageUrl: user.profileImageUrl,
      },
      ...tokens,
    };
  }

  async loginMobileWithGoogle(
    input: {
      providerUserId: string;
      email: string | null;
      emailVerified: boolean;
    } & MobileTokenContext,
  ) {
    const result = await this.resolveOAuthUser({
      ...input,
      provider: AuthProvider.GOOGLE,
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

    const tokens = await this.issueMobileTokens({
      userId: user.id,
      deviceId: input.deviceId,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    await this.authRepository.updateLastLogin(user.id);
    this.recordLogin(user.id, "GOOGLE_MOBILE");

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        status: user.status,
        profileVisibility: user.profileVisibility,
        isAdmin: user.isAdmin,
        profileImageUrl: user.profileImageUrl,
      },
      ...tokens,
    };
  }

  async loginMobileWithNaver(
    input: {
      providerUserId: string;
      email: string | null;
      emailVerified: boolean;
    } & MobileTokenContext,
  ) {
    const result = await this.resolveOAuthUser({
      ...input,
      provider: AuthProvider.NAVER,
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

    const tokens = await this.issueMobileTokens({
      userId: user.id,
      deviceId: input.deviceId,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    await this.authRepository.updateLastLogin(user.id);
    this.recordLogin(user.id, "NAVER_MOBILE");

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        status: user.status,
        profileVisibility: user.profileVisibility,
        isAdmin: user.isAdmin,
        profileImageUrl: user.profileImageUrl,
      },
      ...tokens,
    };
  }

  async completeMobileOauthSignup(
    input: MobileOauthSignupRequestDto & MobileTokenContext,
  ) {
    const nickname = normalizeNickname(input.nickname);
    const nicknameError = validateNickname(nickname);

    if (nicknameError) {
      throw new BadRequestException(nicknameError);
    }
    const tokenHash = createHash("sha256").update(input.ticket).digest("hex");
    const user = await this.authRepository.createOauthUser({
      ticketHash: tokenHash,
      nickname,
      termsVersion: CURRENT_TERMS_VERSION,
      marketing: input.terms.marketing ?? false,
    });

    const tokens = await this.issueMobileTokens({
      userId: user.id,
      deviceId: input.deviceId,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    return { user, ...tokens };
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

    const tokenHash = createHash("sha256").update(input.ticket).digest("hex");
    const user = await this.authRepository.createOauthUser({
      ticketHash: tokenHash,
      nickname,
      termsVersion: CURRENT_TERMS_VERSION,
      marketing: input.terms.marketing ?? false,
    });

    const sessionToken = randomBytes(32).toString("base64url");
    const sessionTokenHash = createHash("sha256")
      .update(sessionToken)
      .digest("hex");
    const sessionExpiresAt = new Date(Date.now() + SESSION_EXPIRES_IN_MS);

    await this.authRepository.createSession({
      userId: user.id,
      tokenHash: sessionTokenHash,
      expiresAt: sessionExpiresAt,
    });

    return { user, sessionToken, sessionExpiresAt };
  }

  async loginMobile(
    input: LoginRequestDto & {
      deviceId?: string;
      userAgent?: string;
      ipAddress?: string;
    },
  ) {
    const email = input.email.trim().toLowerCase();
    const user = await this.authRepository.findUserWithPassword(email);
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
    const tokens = await this.issueMobileTokens({
      userId: user.id,
      deviceId: input.deviceId,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    await this.authRepository.updateLastLogin(user.id);
    this.recordLogin(user.id, "EMAIL_MOBILE");
    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        status: user.status,
        profileVisibility: user.profileVisibility,
        isAdmin: user.isAdmin,
        profileImageUrl: user.profileImageUrl,
      },
      ...tokens,
    };
  }

  async refreshMobileTokens(
    input: RefreshMobileTokensInput,
  ): Promise<MobileTokenPair> {
    if (!input.refreshToken) {
      throw new UnauthorizedException("Refresh Token이 필요합니다.");
    }
    const tokenHash = createHash("sha256")
      .update(input.refreshToken)
      .digest("hex");
    const currentToken =
      await this.authRepository.findMobileRefreshToken(tokenHash);

    const now = new Date();
    if (
      !currentToken ||
      currentToken.revokedAt ||
      currentToken.expiresAt <= now ||
      currentToken.user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException("Refresh Token이 유효하지 않습니다.");
    }
    const accessToken = randomBytes(32).toString("base64url");
    const refreshToken = randomBytes(48).toString("base64url");

    const accessTokenHash = createHash("sha256")
      .update(accessToken)
      .digest("hex");
    const refreshTokenHash = createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const accessTokenExpiresAt = new Date(
      Date.now() + MOBILE_ACCESS_TOKEN_EXPIRES_IN_MS,
    );
    const refreshTokenExpiresAt = new Date(
      Date.now() + MOBILE_REFRESH_TOKEN_EXPIRES_IN_MS,
    );
    const rotated = await this.authRepository.rotateMobileRefreshToken({
      currentTokenId: currentToken.id,
      userId: currentToken.user.id,
      currentExpiresAt: currentToken.expiresAt,
      now,
      accessTokenHash,
      refreshTokenHash,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      deviceId: input.deviceId ?? currentToken.deviceId ?? undefined,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    if (!rotated) {
      throw new UnauthorizedException(
        "Refresh Token이 이미 폐기되었거나 사용되었습니다.",
      );
    }

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  private recordLogin(userId: string, provider: string) {
    void this.activityService.record({
      userId,
      type: UserActivityType.LOGIN,
      metadata: { provider },
    });
  }

  private async resolveOAuthUser(input: {
    provider: AuthProvider;
    providerUserId: string;
    email: string | null;
    emailVerified: boolean;
  }) {
    const signupToken = randomBytes(32).toString("base64url");
    const result = await this.authRepository.resolveOAuthUser({
      ...input,
      signupTokenHash: createHash("sha256").update(signupToken).digest("hex"),
      signupTokenExpiresAt: new Date(
        Date.now() + OAUTH_SIGNUP_TICKET_EXPIRES_IN_MS,
      ),
    });

    if (result.type === "signup") {
      return {
        type: "signup" as const,
        signupToken,
      };
    }

    return result;
  }

  private async issueMobileTokens(
    input: IssueMobileTokensInput,
  ): Promise<MobileTokenPair> {
    const accessToken = randomBytes(32).toString("base64url");
    const refreshToken = randomBytes(48).toString("base64url");

    const accessTokenHash = createHash("sha256")
      .update(accessToken)
      .digest("hex");
    const refreshTokenHash = createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const accessTokenExpiresAt = new Date(
      Date.now() + MOBILE_ACCESS_TOKEN_EXPIRES_IN_MS,
    );
    const refreshTokenExpiresAt = new Date(
      Date.now() + MOBILE_REFRESH_TOKEN_EXPIRES_IN_MS,
    );
    await this.authRepository.createMobileTokenRecords({
      userId: input.userId,
      accessTokenHash,
      refreshTokenHash,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      deviceId: input.deviceId,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });
    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }
}
