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
