import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";

import "../global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryProvider } from "@/provider/query-provider";

export default function RootLayout() {
  return (
    <QueryProvider>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
        <PortalHost />
      </SafeAreaProvider>
    </QueryProvider>
  );
}
