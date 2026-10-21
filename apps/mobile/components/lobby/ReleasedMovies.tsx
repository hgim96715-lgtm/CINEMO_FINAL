import { useQuery } from "@tanstack/react-query";

import { movieReleasedQueryOptions } from "@/lib/queries/movie-released.query";
import { getImageUrl } from "@/lib/utils";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { CINEMO_COLORS } from "@cinemo/shared";
import { router } from "expo-router";
import { SectionHeader } from "@/components/lobby/SectionHeader";
import { CalendarDays } from "lucide-react-native";

function formatReleaseDate(releaseDate: string | null) {
  if (!releaseDate) return "개봉일 미정";

  const date = new Date(`${releaseDate}T00:00:00`);
  const currentYear = new Date().getFullYear();
  const dateLabel = `${date.getMonth() + 1}월 ${date.getDate()}일`;

  return date.getFullYear() === currentYear
    ? dateLabel
    : `${date.getFullYear()}년 ${dateLabel}`;
}

export function ReleasedMovies() {
  const releasedQuery = useQuery(
    movieReleasedQueryOptions({
      page: 1,
      limit: 10,
    }),
  );
  if (releasedQuery.isPending || releasedQuery.isError) {
    return null;
  }
  const movies = releasedQuery.data.items;
  if (movies.length === 0) return null;
  return (
    <View className="mt-6">
      <SectionHeader
        eyebrow="RELEASED THIS YEAR"
        title="올해 개봉한 영화"
        morePath="/movies/released"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 20,
          paddingRight: 4,
        }}
      >
        {movies.map((movie) => {
          const posterUrl = getImageUrl(movie.posterUrl);

          return (
            <Pressable
              key={movie.id}
              className="mr-4"
              style={{ width: 112 }}
              onPress={() => router.push(`/movies/${movie.id}`)}
            >
              <View
                className="overflow-hidden rounded-2xl"
                style={{
                  width: 112,
                  height: 168,
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
                className="mt-3 text-sm font-medium"
                style={{ color: CINEMO_COLORS.textPrimary }}
              >
                {movie.title}
              </Text>

              <View className="mt-1 flex-row items-center gap-1">
                <CalendarDays
                  size={13}
                  color={CINEMO_COLORS.textSecondary}
                />
                <Text
                  className="text-xs"
                  style={{ color: CINEMO_COLORS.textSecondary }}
                >
                  {formatReleaseDate(movie.releaseDate)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
