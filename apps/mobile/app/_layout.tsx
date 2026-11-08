import { useEffect, useRef, useState } from "react";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { PortalHost } from "@rn-primitives/portal";
import { CINEMO_COLORS } from "@cinemo/shared";
import { DarkTheme, ThemeProvider, router, Stack, useGlobalSearchParams, useSegments } from "expo-router";
import { AppState, Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import { mobileQueryClient, QueryProvider } from "@/provider/query-provider";
import * as Notifications from "expo-notifications";
import { getMobileAccessToken } from "@/lib/api/apiClient";
import { getDailyMovieDay, recordDailyMovieVisit } from "@/lib/api/daily-movie";
import { recordAppVisit } from "@/lib/api/visits";
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

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: CINEMO_COLORS.background,
    card: CINEMO_COLORS.background,
    text: CINEMO_COLORS.textPrimary,
    primary: CINEMO_COLORS.accentLight,
  },
};

export default function RootLayout() {
  const openedRecommendation = useRef<string | null>(null);
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
  const isIntroScreen = segments[0] === undefined;
  const isAuthScreen = segments[0] === "login" || segments[0] === "email-login";
  const isMyUniverseScreen = segments[0] === "my-universe";
  const showHeader = (!isIntroScreen || isAuthScreen) && !isMyUniverseScreen;
  const showBottomTabBar =
    ["lobby", "search", "postcards", "my-cinema", "my-universe"].includes(
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
    if (isAuthReady && Platform.OS !== "web") void recordAppVisit();
  }, [isAuthReady]);

  useEffect(() => {
    if (!isAuthReady || Platform.OS === "web") return;
    let currentDay = getDailyMovieDay();
    const recordVisit = () => {
      const day = getDailyMovieDay();
      if (day !== currentDay) {
        currentDay = day;
        void mobileQueryClient.invalidateQueries({ queryKey: ["daily-movie"] });
      }
      void recordDailyMovieVisit();
    };
    recordVisit();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") recordVisit();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === "active") recordVisit();
    }, 30 * 60_000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [isAuthReady]);

  useEffect(() => {
    if (!isAuthReady || Platform.OS === "web") return;
    function openRecommendation(response: Notifications.NotificationResponse) {
      const { identifier, content } = response.notification.request;
      const { type, movieId } = content.data ?? {};
      if (type !== "daily-movie" || typeof movieId !== "string" ||
          !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(movieId) ||
          identifier === openedRecommendation.current) return;

      openedRecommendation.current = identifier;
      router.push({ pathname: "/movies/[id]", params: { id: movieId } });
      Notifications.clearLastNotificationResponse();
    }
    const subscription = Notifications.addNotificationResponseReceivedListener(openRecommendation);
    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) openRecommendation(lastResponse);
    return () => subscription.remove();
  }, [isAuthReady]);

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

  useEffect(() => {
    if (!isAuthReady || !isAuthScreen) {
      return;
    }

    if (getMobileAccessToken()) {
      router.replace(from === "my-cinema" ? "/my-cinema" : "/lobby");
    }
  }, [from, isAuthReady, isAuthScreen]);

  return (
    <QueryProvider>
      <ThemeProvider value={navigationTheme}>
        <SafeAreaProvider style={{ backgroundColor: CINEMO_COLORS.background }}>
          <View className="flex-1" style={{ backgroundColor: CINEMO_COLORS.background }}>
            <View
              style={showHeader ? undefined : styles.hiddenHeader}
              pointerEvents={showHeader ? "auto" : "none"}
              accessibilityElementsHidden={!showHeader}
              importantForAccessibility={showHeader ? "auto" : "no-hide-descendants"}
            >
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
      </ThemeProvider>
    </QueryProvider>
  );
}


const styles = StyleSheet.create({
  // Keep the decoded logo mounted while the full-screen route uses the header's space.
  hiddenHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
  },
});
