import axios, {
  type InternalAxiosRequestConfig,
} from "axios";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let accessToken: string | null = null;


export function getMobileAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export const apiClient = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3050"}/v1`,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    const request = error.config as
      | RetryableRequestConfig
      | undefined;

    const isAuthRequest = [
      "/auth/mobile/login",
      "/auth/mobile/apple",
      "/auth/mobile/google",
      "/auth/mobile/oauth/signup",
      "/auth/mobile/refresh",
      "/auth/mobile/logout",
    ].some((path) => request?.url?.includes(path));

    if (
      error.response?.status !== 401 ||
      !request ||
      request._retry ||
      isAuthRequest
    ) {
      throw error;
    }

    request._retry = true;

    const { refreshMobileAccessToken } = await import("./auth");
    const session = await refreshMobileAccessToken();
    if (accessToken !== session.accessToken) throw error;
    request.headers.Authorization = `Bearer ${session.accessToken}`;

    return apiClient(request);
  },
);
