import { CINEMO_COLORS } from "@cinemo/shared";
import { Animated, ScrollView, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useEffect, useRef } from "react";

import { SectionHeader } from "./SectionHeader";

type SkeletonBlockProps = {
  style?: StyleProp<ViewStyle>;
};

function SkeletonBlock({ style }: SkeletonBlockProps) {
  return <View style={[{ backgroundColor: "rgba(255,255,255,0.10)" }, style]} />;
}

function SkeletonPulse({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0.48)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.48,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

type MovieCollectionSkeletonProps = {
  eyebrow: string;
  title: string;
  cardWidth?: number;
  cardHeight?: number;
  showMeta?: boolean;
};

export function MovieCollectionSkeleton({
  eyebrow,
  title,
  cardWidth = 112,
  cardHeight = 168,
  showMeta = false,
}: MovieCollectionSkeletonProps) {
  return (
    <View className="mt-6">
      <SectionHeader eyebrow={eyebrow} title={title} />
      <SkeletonPulse>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 20, paddingRight: 4 }}
        >
          {Array.from({ length: 4 }, (_, index) => (
            <View key={index} style={{ width: cardWidth, marginRight: 16 }}>
              <SkeletonBlock
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  borderRadius: 16,
                  backgroundColor: CINEMO_COLORS.surface,
                }}
              />
              <SkeletonBlock
                style={{ height: 14, width: "76%", borderRadius: 7, marginTop: 12 }}
              />
              {showMeta ? (
                <SkeletonBlock
                  style={{ height: 11, width: "58%", borderRadius: 6, marginTop: 8 }}
                />
              ) : null}
            </View>
          ))}
        </ScrollView>
      </SkeletonPulse>
    </View>
  );
}

export function TodayMovieSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="오늘의 영화를 고르는 중"
      className="mx-5 mt-4 overflow-hidden rounded-3xl border border-cinemo-gold/25 bg-cinemo-surface px-4 py-4"
    >
      <SkeletonPulse>
        <View className="flex-row items-center gap-2">
          <SkeletonBlock style={{ width: 16, height: 16, borderRadius: 8 }} />
          <SkeletonBlock style={{ width: 92, height: 12, borderRadius: 6 }} />
        </View>
        <View className="mt-3 flex-row items-center gap-4">
          <SkeletonBlock style={{ width: 88, height: 132, borderRadius: 12 }} />
          <View className="flex-1 gap-3">
            <SkeletonBlock style={{ width: "72%", height: 23, borderRadius: 8 }} />
            <SkeletonBlock style={{ width: "36%", height: 12, borderRadius: 6 }} />
            <SkeletonBlock style={{ width: "96%", height: 14, borderRadius: 7 }} />
            <SkeletonBlock style={{ width: "68%", height: 14, borderRadius: 7 }} />
            <SkeletonBlock style={{ width: "42%", height: 12, borderRadius: 6, marginTop: 4 }} />
          </View>
        </View>
      </SkeletonPulse>
    </View>
  );
}

export function MobileCurationHeroSkeleton({
  kind = "commemorative",
}: {
  kind?: "commemorative" | "upcoming" | "platform";
}) {
  const showDescription = kind === "commemorative";
  const titleLines = kind === "platform" ? 2 : 1;

  return (
    <View className="mx-5 mt-5 overflow-hidden rounded-3xl border border-cinemo-gold/20 bg-cinemo-surface px-5 py-6">
      <SkeletonPulse>
        <View className="flex-row items-center justify-between">
          <SkeletonBlock style={{ width: 132, height: 12, borderRadius: 6 }} />
          <SkeletonBlock style={{ width: 36, height: 36, borderRadius: 18 }} />
        </View>
        <View className="mt-[18px] gap-2">
          {Array.from({ length: titleLines }, (_, index) => (
            <SkeletonBlock
              key={index}
              style={{
                width: index === titleLines - 1 && titleLines > 1 ? "64%" : "74%",
                height: 29,
                borderRadius: 9,
              }}
            />
          ))}
        </View>
        {showDescription ? (
          <View className="mt-4 gap-2">
            <SkeletonBlock style={{ width: "100%", height: 13, borderRadius: 7 }} />
            <SkeletonBlock style={{ width: "72%", height: 13, borderRadius: 7 }} />
          </View>
        ) : null}
        <View className="mt-6 flex-row gap-4">
          <SkeletonBlock style={{ width: 132, height: 198, borderRadius: 18 }} />
          <View className="flex-1 justify-center gap-3">
            <SkeletonBlock style={{ width: "88%", height: 22, borderRadius: 8 }} />
            <SkeletonBlock style={{ width: "100%", height: 14, borderRadius: 7 }} />
            <SkeletonBlock style={{ width: "72%", height: 14, borderRadius: 7 }} />
            <SkeletonBlock style={{ width: "45%", height: 13, borderRadius: 7, marginTop: 8 }} />
          </View>
        </View>
      </SkeletonPulse>
    </View>
  );
}

export function PostcardHeroSkeleton() {
  return (
    <View className="mx-5 mt-5 h-[310px] overflow-hidden rounded-3xl border border-white/10 bg-cinemo-surface p-5">
      <SkeletonPulse>
        <View className="flex-row justify-between">
          <SkeletonBlock style={{ width: 118, height: 12, borderRadius: 6 }} />
          <SkeletonBlock style={{ width: 48, height: 24, borderRadius: 12 }} />
        </View>
        <View className="mt-auto flex-row items-end gap-4">
          <View className="flex-1 gap-3">
            <SkeletonBlock style={{ width: "48%", height: 14, borderRadius: 7 }} />
            <SkeletonBlock style={{ width: "100%", height: 21, borderRadius: 8 }} />
            <SkeletonBlock style={{ width: "82%", height: 21, borderRadius: 8 }} />
            <SkeletonBlock style={{ width: "70%", height: 21, borderRadius: 8 }} />
          </View>
          <SkeletonBlock style={{ width: 96, height: 144, borderRadius: 14 }} />
        </View>
        <SkeletonBlock style={{ width: "26%", height: 12, borderRadius: 6, marginTop: 20 }} />
      </SkeletonPulse>
    </View>
  );
}
