import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { CINEMO_COLORS } from "@cinemo/shared";

import { CinemoBackground } from "@/components/common/CinemoBackground";
import { MovieListHeader } from "@/components/movies/MovieListHeader";
import { MovieGridCard } from "@/components/movies/MovieGridCard";
import { movieReleasedQueryOptions } from "@/lib/queries/movie-released.query";

const GRID_HORIZONTAL_PADDING = 32;
const GRID_GAP = 16;

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

  const movies = useMemo(
    () =>
      [...(releasedQuery.data?.items ?? [])].sort((a, b) =>
        (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""),
      ),
    [releasedQuery.data?.items],
  );
  const renderMovie = useCallback(
    ({ item: movie }: { item: (typeof movies)[number] }) => (
      <MovieGridCard
        movie={movie}
        cardWidth={cardWidth}
        releaseLabel={formatReleaseDate(movie.releaseDate)}
      />
    ),
    [cardWidth, movies],
  );

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-cinemo-bg">
      <CinemoBackground />

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
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          windowSize={5}
          renderItem={renderMovie}
        />
      )}
    </SafeAreaView>
  );
}
