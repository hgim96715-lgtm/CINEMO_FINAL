import { useEffect, useState } from "react";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { PortalHost } from "@rn-primitives/portal";
import { CINEMO_COLORS } from "@cinemo/shared";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import { QueryProvider } from "@/provider/query-provider";
import * as Notifications from "expo-notifications";
import { restoreMobileSession } from "@/lib/api/auth";
import { registerDevicePushToken } from "@/lib/api/notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

if (googleWebClientId && googleIosClientId) {
  GoogleSignin.configure({
    webClientId: googleWebClientId,
    iosClientId: googleIosClientId,
  });
}

export default function RootLayout() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  useEffect(() => {
    async function restoreSession() {
      try {
        const session = await restoreMobileSession();

        setHasActiveSession(Boolean(session));
      } catch {
        setHasActiveSession(false);
      } finally {
        setIsAuthReady(true);
      }
    }

    void restoreSession();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !hasActiveSession) {
      return;
    }

    async function registertoken() {
      try {
        await registerDevicePushToken();
        console.log("[푸시 토큰 서버 등록 완료]");
      } catch (error) {
        console.warn("[푸시 토큰 등록 실패]", error);
      }
    }
    void registertoken();
  }, [isAuthReady, hasActiveSession]);

  return (
    <QueryProvider>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: CINEMO_COLORS.background,
            },
          }}
        />
        <PortalHost />
      </SafeAreaProvider>
    </QueryProvider>
  );
}
