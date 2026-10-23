import { apiClient } from "@/lib/api/apiClient";
import { registerPushToken } from "@/lib/notifications/registerPushToken";

export type RegisterPushTokenResponse = {
  id: string;
  token: string;
  platform: "IOS" | "ANDROID";
  lastUsedAt: string;
};

export async function registerDevicePushToken(): Promise<RegisterPushTokenResponse> {
  const { token, platform } = await registerPushToken();

  const response = await apiClient.post<RegisterPushTokenResponse>(
    "/notifications/push-token",
    {
      token,
      platform: platform.toUpperCase(),
    },
  );

  return response.data;
}
