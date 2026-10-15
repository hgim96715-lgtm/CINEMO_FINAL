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
  if (count === null) return "-";

  const flooredCount = Math.floor(count / 1_000) * 1_000;

  return `누적 ${numberFormatter.format(flooredCount)}`;
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
  return (
    <Pressable className="mr-4 w-34" onPress={onPress}>
      <View className="relative overflow-hidden rounded-2xl">
        {movie.posterUrl ? (
          <Image
            source={{ uri: movie.posterUrl }}
            resizeMode="cover"
            style={{ width: 136, height: 204 }}
          />
        ) : (
          <View style={{ width: 136, height: 204 }} />
        )}
      <Text
        className="absolute bottom-2 left-2 text-3xl font-black leading-none"
        style={{ color: CINEMO_COLORS.accent }}
      >
          {movie.rank ?? index + 1}
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
        {movie.totalAudienceCount !== null && (
          <Text className="text-xs" style={{ color: CINEMO_COLORS.textSecondary }}>
            {formatAudience(movie.totalAudienceCount)}
          </Text>
        )}

        <RankChange value={movie.rankChange} />
      </View>
    </Pressable>
  );
}
