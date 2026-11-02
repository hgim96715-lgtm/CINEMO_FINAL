import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { CINEMO_COLORS } from "@cinemo/shared";
import {
  MobileCurationHero,
  type MobileHeroKind,
} from "./MobileCurationHero";
import { PostcardHeroCarousel } from "./PostcardHeroCarousel";

type HeroTab = MobileHeroKind | "postcard";

const tabs: Array<{ value: HeroTab; label: string }> = [
  { value: "commemorative", label: "기념일" },
  { value: "upcoming", label: "이번 주 극장" },
  { value: "platform", label: "플랫폼" },
  { value: "postcard", label: "엽서" },
];

export function LobbyHeroTabs() {
  const [activeTab, setActiveTab] = useState<HeroTab>("commemorative");

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 24 }}
        className="border-b border-white/10"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;

          return (
            <Pressable
              key={tab.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => setActiveTab(tab.value)}
              className="select-none border-b-2 pb-3"
              style={{
                borderBottomColor: isActive
                  ? CINEMO_COLORS.accent
                  : "transparent",
              }}
            >
              <Text
                className="text-sm font-medium"
                style={{
                  color: isActive
                    ? CINEMO_COLORS.accent
                    : CINEMO_COLORS.textSecondary,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {activeTab !== "postcard" && <MobileCurationHero kind={activeTab} />}
      {activeTab === "postcard" && <PostcardHeroCarousel />}
    </View>
  );
}
