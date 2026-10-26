import { useEffect, useState } from "react";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { PortalHost } from "@rn-primitives/portal";
import { CINEMO_COLORS } from "@cinemo/shared";
import { Stack, useGlobalSearchParams, useSegments } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import { QueryProvider } from "@/provider/query-provider";
import * as Notifications from "expo-notifications";
import { restoreMobileSession } from "@/lib/api/auth";
import { registerDevicePushToken } from "@/lib/api/notifications";
import { BottomTabBar } from "@/components/common/BottomTabBar";
import { Header } from "@/components/common/Header";

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
  const segments = useSegments();
  const { from } = useGlobalSearchParams<{ from?: string }>();
  const isMovieDetailScreen =
    segments[0] === "movies" && segments.includes("[id]");
  const isPersonDetailScreen =
    segments[0] === "people" && segments.includes("[id]");
  const isPostcardDetailScreen =
    segments[0] === "postcards" && segments.includes("[id]");
  const showBottomTabBar =
    ["lobby", "search", "postcards", "my-cinema"].includes(
      segments[0] ?? "",
    ) ||
    (segments[0] === "login" && from === "my-cinema") ||
    isMovieDetailScreen ||
    isPersonDetailScreen ||
    isPostcardDetailScreen;

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
        <View className="flex-1">
          <View style={{ display: showBottomTabBar ? "flex" : "none" }}>
            <SafeAreaView edges={["top"]} className="bg-cinemo-bg">
              <Header showSearch={false} showAccount={false} />
            </SafeAreaView>
          </View>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: CINEMO_COLORS.background,
              },
            }}
          />
          <View style={{ display: showBottomTabBar ? "flex" : "none" }}>
            <BottomTabBar />
          </View>
        </View>
        <PortalHost />
      </SafeAreaProvider>
    </QueryProvider>
  );
}
