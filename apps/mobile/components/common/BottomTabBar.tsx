import { Ionicons } from "@expo/vector-icons";
import { CINEMO_COLORS } from "@cinemo/shared";
import { router, useGlobalSearchParams, useSegments } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabKey = "lobby" | "search" | "postcards" | "my-cinema";

const tabs: Array<{
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: "/lobby" | "/search" | "/postcards" | "/my-cinema";
}> = [
  { key: "lobby", label: "홈", icon: "home-outline", route: "/lobby" },
  { key: "search", label: "검색", icon: "search-outline", route: "/search" },
  {
    key: "postcards",
    label: "엽서",
    icon: "mail-outline",
    route: "/postcards",
  },
  {
    key: "my-cinema",
    label: "내 시네마",
    icon: "person-outline",
    route: "/my-cinema",
  },
];

export function BottomTabBar() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { from } = useGlobalSearchParams<{ from?: string }>();
  const activeTab =
    segments[0] === "login" && from === "my-cinema"
      ? "my-cinema"
      : (segments[0] as TabKey | undefined);

  return (
    <View
      className="border-t bg-cinemo-bg"
      style={{
        borderTopColor: "rgba(255,255,255,0.1)",
        paddingBottom: insets.bottom,
      }}
    >
      <View className="h-[52px] flex-row items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const color = isActive
            ? CINEMO_COLORS.accentLight
            : CINEMO_COLORS.textSecondary;

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              onPress={() => router.replace(tab.route)}
              className="h-12 min-w-[68px] items-center justify-center gap-0.5 rounded-2xl px-2 py-1"
              style={{
                backgroundColor: isActive
                  ? "rgba(212,181,106,0.12)"
                  : "transparent",
              }}
            >
              <Ionicons name={tab.icon} size={22} color={color} />
              <Text className="text-xs" style={{ color }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
