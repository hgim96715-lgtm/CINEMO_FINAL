import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { movieUpcomingQueryOptions } from "@/lib/queries/movie-upcoming.query";
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

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const GRID_HORIZONTAL_PADDING = 32;
const GRID_GAP = 16;

function getUpcomingMonthOptions() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);

  return Array.from({ length: 3 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 + index, 1));

    return {
      value: date.toISOString().slice(0, 7),
      label: `${date.getUTCMonth() + 1}월`,
    };
  });
}

function formatReleaseDate(releaseDate: string | null) {
  if (!releaseDate) return "개봉일 미정";

  const targetDate = new Date(`${releaseDate}T00:00:00Z`);
  const todayString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
  }).format(new Date());
  const todayDate = new Date(`${todayString}T00:00:00Z`);

  const days = Math.round(
    (targetDate.getTime() - todayDate.getTime()) / DAY_IN_MS,
  );
  const dateLabel =
    targetDate.getUTCFullYear() === todayDate.getUTCFullYear()
      ? `${targetDate.getUTCMonth() + 1}월 ${targetDate.getUTCDate()}일`
      : `${targetDate.getUTCFullYear()}년 ${targetDate.getUTCMonth() + 1}월 ${targetDate.getUTCDate()}일`;

  return `D-${days} · ${dateLabel}`;
}

export default function UpcomingMoviesScreen() {
  const [filter, setFilter] = useState("all");
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - GRID_HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;

  const filterOptions = useMemo(
    () => [
      { value: "all", label: "전체" },
      { value: "this-week", label: "이번 주" },
      ...getUpcomingMonthOptions(),
    ],
    [],
  );

  const upcomingQuery = useQuery(
    movieUpcomingQueryOptions({
      period: filter === "this-week" ? "this-week" : undefined,
      yearMonth:
        filter !== "all" && filter !== "this-week" ? filter : undefined,
      page: 1,
      limit: 100,
    }),
  );
  const movies = useMemo(
    () =>
      [...(upcomingQuery.data?.items ?? [])].sort((a, b) =>
        (a.releaseDate ?? "9999-12-31").localeCompare(
          b.releaseDate ?? "9999-12-31",
        ),
      ),
    [upcomingQuery.data?.items],
  );
  const renderMovie = useCallback(
    ({ item: movie }: { item: (typeof movies)[number] }) => (
      <MovieGridCard
        movie={movie}
        cardWidth={cardWidth}
        releaseLabel={formatReleaseDate(movie.releaseDate)}
        titleClassName="text-base font-semibold"
      />
    ),
    [cardWidth, movies],
  );
  return (
    <SafeAreaView edges={[]} className="flex-1 bg-cinemo-bg">
      <CinemoBackground />

      <MovieListHeader
        eyebrow="COMING SOON"
        title="개봉 예정작"
        filter={filter}
        options={filterOptions}
        onFilterChange={setFilter}
      />

      {upcomingQuery.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={CINEMO_COLORS.accentLight} />
        </View>
      ) : upcomingQuery.isError ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text style={{ color: CINEMO_COLORS.textPrimary }}>
            개봉 예정작을 불러오지 못했습니다.
          </Text>
          <Pressable
            className="mt-4 rounded-xl bg-cinemo-gold px-5 py-3"
            onPress={() => upcomingQuery.refetch()}
          >
            <Text className="font-semibold text-cinemo-bg">다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={movies}
          numColumns={2}
          keyExtractor={(movie) => movie.id}
          columnWrapperStyle={{
            gap: GRID_GAP,
          }}
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
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text style={{ color: CINEMO_COLORS.textSecondary }}>
                개봉 예정작이 없습니다.
              </Text>
            </View>
          }
          renderItem={renderMovie}
        />
      )}
    </SafeAreaView>
  );
}
