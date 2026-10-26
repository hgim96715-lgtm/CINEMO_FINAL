import type { MovieSearchItemResponse } from "@cinemo/api-contract";
import { CINEMO_COLORS } from "@cinemo/shared";
import { router } from "expo-router";
import { CalendarDays } from "lucide-react-native";
import { memo } from "react";
import { Image, Pressable, Text, View } from "react-native";

import { getImageUrl } from "@/lib/utils";

type MovieGridCardProps = {
  movie: MovieSearchItemResponse;
  cardWidth: number;
  releaseLabel: string;
  titleClassName?: string;
};

export const MovieGridCard = memo(function MovieGridCard({
  movie,
  cardWidth,
  releaseLabel,
  titleClassName = "text-sm font-medium",
}: MovieGridCardProps) {
  const posterUrl = getImageUrl(movie.posterUrl);

  return (
    <Pressable
      style={{ width: cardWidth }}
      onPress={() => router.push(`/movies/${movie.id}`)}
    >
      <View
        className="overflow-hidden rounded-2xl"
        style={{
          width: "100%",
          aspectRatio: 2 / 3,
          backgroundColor: CINEMO_COLORS.surface,
        }}
      >
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            resizeMode="cover"
            style={{ width: "100%", height: "100%" }}
            accessibilityLabel={`${movie.title} 포스터`}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text
              className="text-xs"
              style={{ color: CINEMO_COLORS.textSecondary }}
            >
              포스터 준비중
            </Text>
          </View>
        )}
      </View>

      <Text
        numberOfLines={1}
        className={`mt-3 ${titleClassName}`}
        style={{ color: CINEMO_COLORS.textPrimary }}
      >
        {movie.title}
      </Text>

      <View className="mt-1 flex-row items-center gap-1">
        <CalendarDays size={13} color={CINEMO_COLORS.textSecondary} />
        <Text className="text-xs" style={{ color: CINEMO_COLORS.textSecondary }}>
          {releaseLabel}
        </Text>
      </View>
    </Pressable>
  );
});
