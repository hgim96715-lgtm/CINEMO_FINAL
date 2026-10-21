import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { CINEMO_COLORS } from "@cinemo/shared";

import { CinemoBackground } from "@/components/common/CinemoBackground";
import { Header } from "@/components/common/Header";
import { MovieListHeader } from "@/components/movies/MovieListHeader";
import { movieReleasedQueryOptions } from "@/lib/queries/movie-released.query";
import { router } from "expo-router";
import { CalendarDays } from "lucide-react-native";

const GRID_HORIZONTAL_PADDING = 32;
const GRID_GAP = 16;

function getPosterUrl(url: string | null) {
  return url?.replace(/^http:\/\//i, "https://") ?? null;
}

function getReleasedMonthOptions() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);

  return Array.from({ length: month }, (_, index) => {
    const monthNumber = index + 1;

    return {
      value: `${year}-${String(monthNumber).padStart(2, "0")}`,
      label: `${monthNumber}월`,
    };
  });
}

function formatReleaseDate(releaseDate: string | null) {
  if (!releaseDate) return "개봉일 미정";

  const date = new Date(`${releaseDate}T00:00:00`);
  const currentYear = new Date().getFullYear();
  const dateLabel = `${date.getMonth() + 1}월 ${date.getDate()}일`;

  return date.getFullYear() === currentYear
    ? dateLabel
    : `${date.getFullYear()}년 ${dateLabel}`;
}

export default function ReleasedMoviesScreen() {
  const [filter, setFilter] = useState("all");
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth =
    (screenWidth - GRID_HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;

  const filterOptions = useMemo(
    () => [{ value: "all", label: "전체" }, ...getReleasedMonthOptions()],
    [],
  );

  const releasedQuery = useQuery(
    movieReleasedQueryOptions({
      yearMonth: filter === "all" ? undefined : filter,
      page: 1,
      limit: 100,
    }),
  );

  const movies = [...(releasedQuery.data?.items ?? [])].sort((a, b) =>
    (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""),
  );

  return (
    <SafeAreaView className="flex-1 bg-cinemo-bg">
      <CinemoBackground />

      <Header onSearchPress={() => router.push("/search")} />

      <MovieListHeader
        eyebrow="THIS YEAR"
        title="올해 개봉한 영화"
        filter={filter}
        options={filterOptions}
        onFilterChange={setFilter}
      />

      {releasedQuery.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={CINEMO_COLORS.accentLight} />
        </View>
      ) : releasedQuery.isError ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text style={{ color: CINEMO_COLORS.textPrimary }}>
            올해 개봉한 영화를 불러오지 못했습니다.
          </Text>

          <Pressable
            className="mt-4 rounded-xl bg-cinemo-gold px-5 py-3"
            onPress={() => releasedQuery.refetch()}
          >
            <Text className="font-semibold text-cinemo-bg">다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={movies}
          numColumns={2}
          keyExtractor={(movie) => movie.id}
          columnWrapperStyle={{ gap: GRID_GAP }}
          contentContainerStyle={{
            gap: 32,
            paddingHorizontal: GRID_HORIZONTAL_PADDING,
            paddingTop: 12,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: movie }) => {
            const posterUrl = getPosterUrl(movie.posterUrl);

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
          }}
        />
      )}
    </SafeAreaView>
  );
}
