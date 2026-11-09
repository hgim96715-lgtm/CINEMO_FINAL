import { apiClient, getMobileAccessToken } from "@/lib/api/apiClient";
import { registerPushToken } from "@/lib/notifications/registerPushToken";

export type RegisterPushTokenResponse = {
  id: string;
  token: string;
  platform: "IOS" | "ANDROID";
  lastUsedAt: string;
};

export async function registerDevicePushToken(): Promise<RegisterPushTokenResponse> {
  const accessToken = getMobileAccessToken();
  if (!accessToken) throw new Error("알림을 등록하려면 다시 로그인해 주세요.");

  const { token, platform } = await registerPushToken();
  if (getMobileAccessToken() !== accessToken) {
    throw new Error("로그인 상태가 바뀌었어요. 다시 시도해 주세요.");
  }

  const response = await apiClient.post<RegisterPushTokenResponse>(
    "/notifications/push-token",
    {
      token,
      platform: platform.toUpperCase(),
    },
  );

  return response.data;
}
