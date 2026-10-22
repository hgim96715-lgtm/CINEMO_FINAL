import { apiClient } from "./apiClient";

export type AuthUser = {
  id: string;
  email: string | null;
  nickname: string;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  profileImageUrl: string | null;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: AuthUser;
  sessionExpiresAt: string;
};

export type OauthSignupInput = {
  ticket: string;
  nickname: string;
  terms: {
    service: true;
    privacy: true;
    marketing: boolean;
  };
};

export type RegisterInput = {
  email: string;
  password: string;
  nickname: string;
  terms: {
    service: true;
    privacy: true;
    marketing: boolean;
  };
};

export type RegisterResponse = {
  user: {
    id: string;
    email: string;
    nickname: string;
    status: string;
    createdAt: string;
  };
  emailVerificationRequired: boolean;
};

export type CheckNicknameResponse = {
  available: boolean;
};

export type CheckEmailResponse = {
  available: boolean;
};

export async function register(
  input: RegisterInput,
): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>(
    "/auth/register",
    input,
  );

  return data;
}

export async function getMe(): Promise<AuthUser | null> {
  const { data } = await apiClient.get<AuthUser>("/auth/me");

  return data;
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", input);
  return data;
}

export async function completeOauthSignup(
  input: OauthSignupInput,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    "/auth/oauth/register",
    input,
  );

  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function requestPasswordReset(
  email: string,
): Promise<{ accepted: boolean }> {
  const { data } = await apiClient.post<{ accepted: boolean }>(
    "/auth/password-reset/request",
    { email },
  );

  return data;
}

export type ResetPasswordInput = {
  token: string;
  newPassword: string;
};

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await apiClient.post("/auth/password-reset/confirm", input);
}

export async function checkNickname(
  nickname: string,
): Promise<CheckNicknameResponse> {
  const { data } = await apiClient.get<CheckNicknameResponse>(
    "/auth/check-nickname",
    {
      params: { nickname },
    },
  );

  return data;
}

export async function checkEmail(
  email: string,
): Promise<CheckEmailResponse> {
  const { data } = await apiClient.get<CheckEmailResponse>(
    "/auth/check-email",
    {
      params: { email },
    },
  );

  return data;
}
