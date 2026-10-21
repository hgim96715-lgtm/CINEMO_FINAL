import type { MovieSearchItemResponse } from "@cinemo/api-contract";
import { Ionicons } from "@expo/vector-icons";
import { CINEMO_COLORS } from "@cinemo/shared";
import { Image, Pressable, Text, View } from "react-native";

type MovieCardProps = {
  movie: MovieSearchItemResponse;
  index: number;
  onPress?: () => void;
};

const numberFormatter = new Intl.NumberFormat("ko-KR", {
  notation: "compact",
  maximumFractionDigits: 1,
  useGrouping: true,
});

function formatAudience(count: number | null) {
  if (count === null) {
    return "-";
  }
  const flooredCount = Math.floor(count / 1_000) * 1_000;
  if (flooredCount >= 10_000) {
    const man = flooredCount / 10_000;
    const formatted = Number.isInteger(man)
      ? String(man)
      : man.toFixed(1).replace(/\.0$/, "");
    return `누적 ${formatted}만`;
  }
  if (flooredCount >= 1_000) {
    return `누적 ${flooredCount / 1_000}천`;
  }

  return `누적 ${flooredCount.toLocaleString("ko-KR")}`;
}

function getMobileImageUrl(url: string | null) {
  if (!url) return null;

  return url.replace(/^http:\/\//i, "https://");
}

function RankChange({ value }: { value: number | null }) {
  if (value === null || value === 0) return null;

  const isUp = value > 0;
  const iconName: "trending-up-outline" | "trending-down-outline" = isUp
    ? "trending-up-outline"
    : "trending-down-outline";
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={iconName} size={16} color={CINEMO_COLORS.accentLight} />

      <Text
        className="text-sm font-semibold"
        style={{ color: CINEMO_COLORS.accentLight }}
      >
        {isUp ? `+${value}` : value}
      </Text>
    </View>
  );
}

export function MovieCard({ movie, index, onPress }: MovieCardProps) {
  const posterUrl = getMobileImageUrl(movie.posterUrl);
  const rank = movie.rank ?? index + 1;

  return (
    <Pressable className="mr-4" style={{ width: 136 }} onPress={onPress}>
      <View
        className="relative overflow-hidden rounded-2xl"
        style={{
          width: 136,
          height: 204,
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
              className="text-center text-xs"
              style={{ color: CINEMO_COLORS.textSecondary }}
            >
              포스터 준비중
            </Text>
          </View>
        )}

        <Text
          className="absolute bottom-2 left-2 text-3xl font-black leading-none"
          style={{
            color: CINEMO_COLORS.textPrimary,
            textShadowColor: "rgba(0, 0, 0, 0.8)",
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 6,
          }}
        >
          {rank}
        </Text>
      </View>

      <Text
        numberOfLines={1}
        className="mt-3 text-sm font-medium"
        style={{ color: CINEMO_COLORS.textPrimary }}
      >
        {movie.title}
      </Text>

      <View className="mt-1 flex-row items-center gap-2">
        {movie.totalAudienceCount !== null ? (
          <Text
            className="text-sm"
            style={{ color: CINEMO_COLORS.textSecondary }}
          >
            {formatAudience(movie.totalAudienceCount)}
          </Text>
        ) : null}

        <RankChange value={movie.rankChange} />
      </View>
    </Pressable>
  );
}
