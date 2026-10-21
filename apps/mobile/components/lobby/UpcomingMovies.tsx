import { useQuery } from "@tanstack/react-query";
import { movieUpcomingQueryOptions } from "@/lib/queries/movie-upcoming.query";
import { CINEMO_COLORS } from "@cinemo/shared";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getPosterUrl(url: string | null) {
  return url?.replace(/^http:\/\//i, "https://") ?? null;
}

function formatReleaseDate(releaseDate: string | null) {
  if (!releaseDate) return "개봉일 미정";

  const targetDate = new Date(`${releaseDate}T00:00:00`);

  const today = new Date();
  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const days =
    Math.round(targetDate.getTime() - todayDate.getTime()) / DAY_IN_MS;
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();

  return `D-${days} · ${month}월 ${day}일`;
}

export function UpcomingMovies() {
  const upcomingQuery = useQuery(
    movieUpcomingQueryOptions({ page: 1, limit: 10 }),
  );

  if (upcomingQuery.isPending) return null;
  if (upcomingQuery.isError) return null;

  const movies = [...upcomingQuery.data.items].sort((a, b) =>
    (a.releaseDate ?? "9999-12-31").localeCompare(
      b.releaseDate ?? "9999-12-31",
    ),
  );
  if (movies.length === 0) return null;

  return (
    <View className="mt-10">
      <View className="mb-5 flex-row items-end justify-between px-5">
        <View>
          <Text
            className="text-xs font-semibold tracking-[4px]"
            style={{ color: CINEMO_COLORS.accentLight }}
          >
            COMING SOON
          </Text>

          <Text
            className="mt-2 text-2xl font-bold"
            style={{ color: CINEMO_COLORS.textPrimary }}
          >
            개봉 예정작
          </Text>
        </View>
        <Pressable
          className="flex-row items-center gap-1"
          onPress={() => router.push("/movies/upcoming")}
        >
          <Text
            className="text-sm"
            style={{ color: CINEMO_COLORS.textSecondary }}
          >
            더보기
          </Text>

          <ChevronRight size={16} color={CINEMO_COLORS.accentLight} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 20,
          paddingRight: 4,
        }}
      >
        {movies.map((movie) => {
          const posterUrl = getPosterUrl(movie.posterUrl);

          return (
            <Pressable
              key={movie.id}
              className="mr-4"
              style={{ width: 136 }}
              onPress={() => router.push(`/movies/${movie.id}`)}
            >
              <View
                className="rounded-2xl overflow-hidden"
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

              <Text
                className="mt-1 text-xs"
                style={{ color: CINEMO_COLORS.textSecondary }}
              >
                {formatReleaseDate(movie.releaseDate)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
