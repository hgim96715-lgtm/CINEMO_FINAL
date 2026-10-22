import * as SecureStore from "expo-secure-store";
import { apiClient, setAccessToken } from "@/lib/api/apiClient";

export type MobileLoginResponse = {
  user: {
    id: string;
    email: string;
    nickname: string;
    status: string;
    profileVisibility: string;
    profileImageUrl: string | null;
  };
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

export type MobileAppleLoginInput = {
  identityToken: string;
  authorizationCode?: string;
  deviceId?: string;
};

export type MobileAppleLoginResponse =
  | MobileLoginResponse
  | {
      requiresRegistration: true;
      signupToken: string;
    };

const REFRESH_TOKEN_KEY = "cinemo.refresh_token";

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function loginAppleMobile(
  input: MobileAppleLoginInput,
): Promise<MobileAppleLoginResponse> {
  const response = await apiClient.post<MobileAppleLoginResponse>(
    "/auth/mobile/apple",
    {
      identityToken: input.identityToken,
      authorizationCode: input.authorizationCode,
      deviceId: input.deviceId,
    },
    {
      headers: input.deviceId ? { "X-Device-Id": input.deviceId } : undefined,
    },
  );

  const data = response.data;

  if ("accessToken" in data) {
    setAccessToken(data.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
  }

  return data;
}

export async function refreshMobileAccessToken(input?: {
  deviceId?: string;
}): Promise<MobileLoginResponse> {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    throw new Error("Refresh Token이 없습니다.");
  }

  try {
    const response = await apiClient.post<MobileLoginResponse>(
      "/auth/mobile/refresh",
      {
        refreshToken,
        deviceId: input?.deviceId,
      },
    );

    const data = response.data;

    setAccessToken(data.accessToken);

    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);

    return data;
  } catch (error) {
    setAccessToken(null);

    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);

    throw error;
  }
}

export async function clearAuthTokens(): Promise<void> {
  setAccessToken(null);

  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function logoutMobile(): Promise<void> {
  const refreshToken = await getRefreshToken();

  try {
    if (refreshToken) {
      await apiClient.post("/auth/mobile/logout", {
        refreshToken,
      });
    }
  } finally {
    await clearAuthTokens();
  }
}

export async function restoreMobileSession(): Promise<MobileLoginResponse | null> {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    return await refreshMobileAccessToken();
  } catch {
    await clearAuthTokens();
    return null;
  }
}

export type MobileOauthSignupInput = {
  ticket: string;
  nickname: string;
  terms: {
    service: boolean;
    privacy: boolean;
    marketing: boolean;
  };
  deviceId?: string;
};

export async function completeMobileOauthSignup(
  input: MobileOauthSignupInput,
): Promise<MobileLoginResponse> {
  const response = await apiClient.post<MobileLoginResponse>(
    "/auth/mobile/oauth/signup",
    {
      ticket: input.ticket,
      nickname: input.nickname,
      terms: input.terms,
      deviceId: input.deviceId,
    },
    {
      headers: input.deviceId ? { "X-Device-Id": input.deviceId } : undefined,
    },
  );
  const data = response.data;
  setAccessToken(data.accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
  return data;
}

export type MobileEmailLoginInput = {
  email: string;
  password: string;
  deviceId?: string;
};

export async function loginEmailMobile(
  input: MobileEmailLoginInput,
): Promise<MobileLoginResponse> {
  const response = await apiClient.post<MobileLoginResponse>(
    "/auth/mobile/login",
    {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      deviceId: input.deviceId,
    },
    {
      headers: input.deviceId ? { "X-Device-Id": input.deviceId } : undefined,
    },
  );

  const data = response.data;

  setAccessToken(data.accessToken);

  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);

  return data;
}

export type CheckEmailResponse = {
  available: boolean;
};

export type CheckNicknameResponse = {
  available: boolean;
};

export async function checkNicknameMobile(
  nickname: string,
): Promise<CheckNicknameResponse> {
  const response = await apiClient.get<CheckNicknameResponse>(
    "/auth/check-nickname",
    {
      params: {
        nickname: nickname.trim(),
      },
    },
  );

  return response.data;
}

export async function checkEmailMobile(
  email: string,
): Promise<CheckEmailResponse> {
  const response = await apiClient.get<CheckEmailResponse>(
    "/auth/check-email",
    {
      params: {
        email: email.trim().toLowerCase(),
      },
    },
  );

  return response.data;
}

export type MobileEmailSignupInput = {
  email: string;
  password: string;
  nickname: string;
  terms: {
    service: true;
    privacy: true;
    marketing: boolean;
  };
};

export type MobileEmailSignupResponse = {
  user: {
    id: string;
    email: string;
    nickname: string;
    status: string;
    createdAt: string;
  };
  emailVerificationRequired: boolean;
};

export async function registerEmailMobile(
  input: MobileEmailSignupInput,
): Promise<MobileEmailSignupResponse> {
  const response = await apiClient.post<MobileEmailSignupResponse>(
    "/auth/register",
    {
      ...input,
      email: input.email.trim().toLowerCase(),
    },
  );

  return response.data;
}

export type MobileGoogleLoginInput = {
  identityToken: string;
  deviceId?: string;
};

export type MobileGoogleLoginResponse = MobileAppleLoginResponse;

export async function loginGoogleMobile(
  input: MobileGoogleLoginInput,
): Promise<MobileGoogleLoginResponse> {
  const response = await apiClient.post<MobileGoogleLoginResponse>(
    "/auth/mobile/google",
    {
      identityToken: input.identityToken,
      deviceId: input.deviceId,
    },
    {
      headers: input.deviceId ? { "X-Device-Id": input.deviceId } : undefined,
    },
  );
  const data = response.data;
  if ("accessToken" in data) {
    setAccessToken(data.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
  }
  return data;
}

export type MobileNaverAuthorizationResponse = {
  authorizationUrl: string;
};

export type MobileNaverExchangeInput = {
  code: string;
  state: string;
  deviceId?: string;
};

export type MobileNaverLoginResponse = MobileAppleLoginResponse;

export async function getNaverMobileAuthorizationUrl(
  state: string,
): Promise<MobileNaverAuthorizationResponse> {
  const response = await apiClient.get<MobileNaverAuthorizationResponse>(
    "/auth/mobile/naver/start",
    {
      params: {
        state,
      },
    },
  );
  return response.data;
}

export async function loginNaverMobile(
  input: MobileNaverExchangeInput,
): Promise<MobileNaverLoginResponse> {
  const response = await apiClient.post<MobileNaverLoginResponse>(
    "/auth/mobile/naver/exchange",
    {
      code: input.code,
      state: input.state,
      deviceId: input.deviceId,
    },
    {
      headers: input.deviceId
        ? {
            "X-Device-Id": input.deviceId,
          }
        : undefined,
    },
  );
  const data = response.data;
  if ("accessToken" in data) {
    setAccessToken(data.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
  }
  return data;
}
