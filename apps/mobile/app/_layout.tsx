import { useEffect, useState } from "react";
import { PortalHost } from "@rn-primitives/portal";
import { CINEMO_COLORS } from "@cinemo/shared";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "../global.css";

import { QueryProvider } from "@/provider/query-provider";
import { restoreMobileSession } from "@/lib/api/auth";

export default function RootLayout() {
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    restoreMobileSession()
      .catch(() => {
        // 저장된 Refresh Token이 없거나 만료된 경우
      })
      .finally(() => {
        setIsAuthReady(true);
      });
  }, []);

  if (!isAuthReady) {
    return null;
  }

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
