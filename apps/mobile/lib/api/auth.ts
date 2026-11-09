import * as AppleAuthentication from "expo-apple-authentication";
import * as SecureStore from "expo-secure-store";
import { isAxiosError } from "axios";
import { apiClient, getMobileAccessToken, setAccessToken } from "@/lib/api/apiClient";

import { recordDailyMovieVisit } from "./daily-movie";
import { myCinemaKeys } from "@/lib/queries/my-cinema.query";
import { mobileQueryClient } from "@/provider/query-provider";

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

let sessionVersion = 0;
let tokenStorage = Promise.resolve();
let refreshInFlight: Promise<MobileLoginResponse> | null = null;

function queueTokenWrite(write: () => Promise<void>) {
  const operation = tokenStorage.then(write);
  tokenStorage = operation.catch(() => {});
  return operation;
}

async function saveMobileSession(session: MobileLoginResponse, version: number) {
  await queueTokenWrite(async () => {
    if (version !== sessionVersion) throw new Error("세션이 변경되었습니다.");
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken);
    if (version !== sessionVersion) throw new Error("세션이 변경되었습니다.");
    setAccessToken(session.accessToken);
  });
}

async function completeMobileLogin(session: MobileLoginResponse) {
  const version = ++sessionVersion;
  refreshInFlight = null;
  await saveMobileSession(session, version);
  await mobileQueryClient.cancelQueries({ queryKey: myCinemaKeys.user() });
  if (version !== sessionVersion) return;
  mobileQueryClient.setQueryData(myCinemaKeys.user(), session.user);
  void recordDailyMovieVisit();
  void registerPushTokenAfterLogin();
}

async function registerPushTokenAfterLogin(): Promise<void> {
  try {
    const { registerDevicePushToken } = await import("./notifications");
    await registerDevicePushToken();
  } catch (error) {
    // 로그인 자체는 성공했으므로 푸시 권한 거부나 시뮬레이터 실행으로 막히지 않게 함
    if (getMobileAccessToken()) console.warn("[푸시 토큰 등록 실패]", error);
  }
}

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
    await completeMobileLogin(data);
  }

  return data;
}

export function refreshMobileAccessToken(): Promise<MobileLoginResponse> {
  if (refreshInFlight) return refreshInFlight;

  const version = sessionVersion;
  const operation = (async () => {
    await tokenStorage;
    const refreshToken = await getRefreshToken();
    if (!refreshToken || version !== sessionVersion) {
      throw new Error("갱신할 세션이 없습니다.");
    }

    try {
      const { data } = await apiClient.post<MobileLoginResponse>("/auth/mobile/refresh", {
        refreshToken,
      });
      await saveMobileSession(data, version);
      return data;
    } catch (error) {
      if (
        version === sessionVersion &&
        isAxiosError(error) &&
        error.response?.status === 401
      ) {
        await clearAuthTokens();
      }
      throw error;
    }
  })().finally(() => {
    if (refreshInFlight === operation) refreshInFlight = null;
  });

  refreshInFlight = operation;
  return operation;
}

export function clearAuthTokens(): Promise<void> {
  sessionVersion++;
  refreshInFlight = null;
  setAccessToken(null);
  return queueTokenWrite(() => SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY));
}

export async function logoutMobile(): Promise<void> {
  const accessToken = getMobileAccessToken();
  let refreshToken: string | null = null;
  const readRefreshToken = queueTokenWrite(async () => {
    refreshToken = await getRefreshToken();
  });
  await Promise.all([readRefreshToken, clearAuthTokens()]);

  if (refreshToken) {
    void apiClient.post("/auth/mobile/logout", { refreshToken }, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    }).catch((error) => {
      console.warn("[서버 로그아웃 실패]", error instanceof Error ? error.message : error);
    });
  }
}

export async function restoreMobileSession(): Promise<MobileLoginResponse | null> {
  try {
    const session = await refreshMobileAccessToken();
    await mobileQueryClient.cancelQueries({ queryKey: myCinemaKeys.user() });
    if (getMobileAccessToken() !== session.accessToken) return null;
    mobileQueryClient.setQueryData(myCinemaKeys.user(), session.user);
    return session;
  } catch {
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
  await completeMobileLogin(data);
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

  await completeMobileLogin(data);

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
    await completeMobileLogin(data);
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
    await completeMobileLogin(data);
  }
  return data;
}

export async function deleteMobileAccount(): Promise<boolean> {
  const { data } = await apiClient.get<{ requiresAppleAuthorization: boolean }>(
    "/auth/me/deletion-requirements",
  );
  let appleAuthorizationCode: string | undefined;
  if (data.requiresAppleAuthorization) {
    if (!(await AppleAuthentication.isAvailableAsync())) {
      throw new Error("Apple 로그인을 사용할 수 있는 iPhone에서 탈퇴를 진행해 주세요.");
    }
    try {
      const credential = await AppleAuthentication.signInAsync();
      appleAuthorizationCode = credential.authorizationCode ?? undefined;
    } catch (error) {
      if ((error as { code?: string } | null)?.code === "ERR_REQUEST_CANCELED") return false;
      throw error;
    }
    if (!appleAuthorizationCode) throw new Error("Apple 계정 인증을 다시 진행해 주세요.");
  }

  await apiClient.delete("/auth/me", { data: { appleAuthorizationCode }, timeout: 20_000 });
  await clearAuthTokens();
  return true;
}
