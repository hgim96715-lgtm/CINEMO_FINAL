import { Pressable, Text, View } from "react-native";

import { CINEMO_COLORS } from "@cinemo/shared";

export type MyCinemaTabKey =
  | "movies"
  | "people"
  | "notifications"
  | "postcards"
  | "settings";

type MyCinemaTabBarProps = {
  activeTab: MyCinemaTabKey;
  onChange: (tab: MyCinemaTabKey) => void;
};

const tabs: Array<[MyCinemaTabKey, string]> = [
  ["movies", "내 영화"],
  ["people", "저장한 인물"],
  ["notifications", "알림"],
  ["postcards", "내 엽서"],
  ["settings", "설정·지원"],
];

export function MyCinemaTabBar({
  activeTab,
  onChange,
}: MyCinemaTabBarProps) {
  return (
    <View
      className="mt-3 flex-row rounded-2xl border p-1"
      style={panelStyle}
    >
      {tabs.map(([key, label]) => {
        const isActive = activeTab === key;

        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={key === "settings" ? "설정 및 고객지원" : label}
            onPress={() => onChange(key)}
            className="min-w-0 flex-1 items-center justify-center rounded-xl px-1 py-3"
            style={{
              backgroundColor: isActive
                ? "rgba(255,255,255,0.1)"
                : "transparent",
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              className="text-center text-xs font-semibold"
              style={{
                color: isActive
                  ? CINEMO_COLORS.accentLight
                  : CINEMO_COLORS.textSecondary,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const panelStyle = {
  borderColor: "rgba(255,255,255,0.1)",
  backgroundColor: "rgba(255,255,255,0.035)",
};
