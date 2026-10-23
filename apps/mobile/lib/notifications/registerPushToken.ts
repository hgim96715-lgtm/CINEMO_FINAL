import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";

const EAS_PROJECT_ID = "b2d00ecf-34e3-4d8b-9ba1-6e0d75cdb2d5";

type PushPlatform = "ios" | "android";
type PushTokenResult = {
  token: string;
  platform: PushPlatform;
};

export async function registerPushToken(): Promise<PushTokenResult> {
  if (!Device.isDevice) {
    throw new Error("실제 모바일 기기에서만 알림을 등록할 수 있습니다.");
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "기본 알림",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();

  let permissionStatus = currentPermission.status;
  if (permissionStatus !== Notifications.PermissionStatus.GRANTED) {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    permissionStatus = requestedPermission.status;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    EAS_PROJECT_ID;

  if (!projectId) {
    throw new Error("Expo projectId가 없습니다.");
  }
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return {
    token,
    platform: Platform.OS === "ios" ? "ios" : "android",
  };
}
