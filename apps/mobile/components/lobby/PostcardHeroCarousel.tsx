import { useInfiniteQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CINEMO_COLORS } from "@cinemo/shared";
import type { Postcard, PostcardMetadata } from "@/lib/api/postcards";
import { postcardFeedQueryOptions } from "@/lib/queries/postcard-feed.query";
import { getImageUrl } from "@/lib/utils";

const AUTO_PLAY_INTERVAL = 6000;

const postcardTypeLabels: Record<Postcard["type"], string> = {
  REVIEW: "감상",
  QUOTE: "인용",
  SCENE: "장면",
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll(" ", "");
}

function getPostcardImage(postcard: Postcard) {
  return getImageUrl(
    postcard.movie?.posterUrl ?? postcard.media[0]?.url ?? null,
  );
}

function getPostcardTranslation(metadata: PostcardMetadata | null) {
  if (metadata?.type !== "QUOTE") {
    return null;
  }

  return (
    metadata.translations?.find(
      (translation) => translation.language.toLowerCase() === "ko",
    )?.content ?? null
  );
}

export function PostcardHeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const postcardsQuery = useInfiniteQuery(postcardFeedQueryOptions());
  const postcards = postcardsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const visiblePostcards = postcards.slice(0, 8);
  const activePostcard = visiblePostcards[activeIndex];

  useEffect(() => {
    if (activeIndex >= visiblePostcards.length && visiblePostcards.length > 0) {
      setActiveIndex(0);
    }
  }, [activeIndex, visiblePostcards.length]);

  useEffect(() => {
    if (visiblePostcards.length <= 1) {
      return;
    }

    const timerId = setInterval(() => {
      setActiveIndex((index) => (index + 1) % visiblePostcards.length);
    }, AUTO_PLAY_INTERVAL);

    return () => clearInterval(timerId);
  }, [visiblePostcards.length]);

  if (postcardsQuery.isPending) {
    return (
      <View className="mx-5 mt-5 h-64 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04]">
        <ActivityIndicator color={CINEMO_COLORS.accent} />
      </View>
    );
  }

  if (postcardsQuery.isError || !activePostcard) {
    return null;
  }

  const imageUrl = getPostcardImage(activePostcard);
  const translation = getPostcardTranslation(
    activePostcard.metadata as PostcardMetadata | null,
  );

  return (
    <View className="mx-5 mt-5 overflow-hidden rounded-3xl border border-white/10 bg-cinemo-surface">
      <View className="h-[310px] overflow-hidden">
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            resizeMode="cover"
            style={[StyleSheet.absoluteFill, { opacity: 0.3 }]}
          />
        )}

        <View
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(8,25,24,0.84)" }}
        />

        <View className="flex-1 justify-between p-5">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-xs text-cinemo-muted">
              {formatDate(activePostcard.createdAt)} · {activePostcard.author?.nickname ?? "익명"}
            </Text>
            <View className="rounded-full border border-cinemo-gold/40 bg-cinemo-gold/10 px-3 py-1">
              <Text className="text-xs text-cinemo-gold">
                {postcardTypeLabels[activePostcard.type]}
              </Text>
            </View>
          </View>

          <View className="flex-row items-end gap-4">
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-medium text-cinemo-gold">
                {activePostcard.movie?.title ?? "영화와 함께 남긴 기록"}
              </Text>
              <Text
                numberOfLines={activePostcard.type === "QUOTE" ? 4 : 5}
                className="mt-3 text-xl font-semibold leading-7 text-cinemo-text"
              >
                {activePostcard.type === "QUOTE"
                  ? `“${activePostcard.content}”`
                  : activePostcard.content}
              </Text>
              {translation && (
                <Text
                  numberOfLines={2}
                  className="mt-2 text-sm text-cinemo-muted"
                >
                  {translation}
                </Text>
              )}
            </View>

            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                resizeMode="cover"
                accessibilityLabel={`${activePostcard.movie?.title ?? "영화"} 포스터`}
                style={styles.poster}
              />
            )}
          </View>

          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="공개 엽서 둘러보기"
              onPress={() => router.push("/postcards")}
              className="rounded-lg px-1 py-1"
            >
              <Text className="text-xs font-semibold text-cinemo-gold-light">
                엽서 둘러보기
              </Text>
            </Pressable>
            <View className="flex-row items-center gap-2">
              {visiblePostcards.map((postcard, index) => (
                <Pressable
                  key={postcard.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${index + 1}번째 엽서 보기`}
                  onPress={() => setActiveIndex(index)}
                  className={`h-2 rounded-full ${index === activeIndex ? "w-7 bg-cinemo-gold" : "w-2 bg-white/40"}`}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  poster: {
    width: 88,
    height: 132,
    borderRadius: 14,
    backgroundColor: CINEMO_COLORS.surface,
  },
});
