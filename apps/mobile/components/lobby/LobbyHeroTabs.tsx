import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  CalendarDays,
  Clapperboard,
  Heart,
  Popcorn,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";

import { CINEMO_COLORS } from "@cinemo/shared";
import {
  MobileCurationHero,
  type MobileHeroKind,
} from "./MobileCurationHero";
import { TodayMovieHero } from "./TodayMovieHero";
import { PostcardHeroCarousel } from "./PostcardHeroCarousel";

type HeroTab = MobileHeroKind | "postcard" | "today";

const tabs: Array<{
  value: HeroTab;
  title: string;
  caption: string;
  icon: LucideIcon;
}> = [
  { value: "today", title: "오늘의 한 장면", caption: "나를 위한 추천", icon: Sparkles },
  { value: "commemorative", title: "필름 캘린더", caption: "오늘의 기념일", icon: CalendarDays },
  { value: "upcoming", title: "곧 만나요", caption: "개봉 전 설렘", icon: Clapperboard },
  { value: "platform", title: "소파 시네마", caption: "오늘 바로 보기", icon: Popcorn },
  { value: "postcard", title: "여운의 엽서", caption: "관객의 한 장면", icon: Heart },
];

export function LobbyHeroTabs() {
  const [activeTab, setActiveTab] = useState<HeroTab>("today");

  return (
    <View className="overflow-hidden border-y border-cinemo-gold/20 bg-cinemo-surface">
      <View className="px-5 pt-7">
        <Text className="text-xs font-semibold tracking-[3.4px] text-cinemo-gold">CINEMO NIGHT GUIDE</Text>
        <Text className="mt-3 text-3xl font-bold text-cinemo-text">오늘은 어떤 장면을 만나볼까?</Text>
        <Text className="mt-2 text-sm text-cinemo-muted">영화의 순간을 골라, 나만의 다음 장면으로.</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, gap: 12 }}
      >
        {tabs.map(({ value, title, caption, icon: Icon }) => {
          const isActive = activeTab === value;

          return (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => setActiveTab(value)}
              className="w-[164px] rounded-2xl border px-4 py-3"
              style={{
                backgroundColor: isActive
                  ? "rgba(199,161,75,0.12)"
                  : "rgba(255,255,255,0.03)",
                borderColor: isActive
                  ? "rgba(199,161,75,0.72)"
                  : "rgba(255,255,255,0.10)",
              }}
            >
              <View className="mb-3 h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/20">
                <Icon size={16} color={isActive ? CINEMO_COLORS.accent : CINEMO_COLORS.textSecondary} />
              </View>
              <Text
                className="text-sm font-semibold"
                style={{
                  color: CINEMO_COLORS.textPrimary,
                }}
              >
                {title}
              </Text>
              <Text className="mt-1 text-xs" style={{ color: CINEMO_COLORS.textSecondary }}>{caption}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="border-t border-white/10">
        {activeTab === "today" && <TodayMovieHero embedded />}
        {activeTab !== "postcard" && activeTab !== "today" && <MobileCurationHero kind={activeTab} embedded />}
        {activeTab === "postcard" && <PostcardHeroCarousel embedded />}
      </View>
    </View>
  );
}
