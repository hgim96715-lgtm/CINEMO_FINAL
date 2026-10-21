import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { movieUpcomingQueryOptions } from "@/lib/queries/movie-upcoming.query";
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
import { getImageUrl } from "@/lib/utils";
import { router } from "expo-router";
import { CalendarDays } from "lucide-react-native";

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

  const targetDate = new Date(`${releaseDate}T00:00:00`);
  const today = new Date();

  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const days = Math.round(
    (targetDate.getTime() - todayDate.getTime()) / DAY_IN_MS,
  );
  const dateLabel =
    targetDate.getFullYear() === todayDate.getFullYear()
      ? `${targetDate.getMonth() + 1}월 ${targetDate.getDate()}일`
      : `${targetDate.getFullYear()}년 ${targetDate.getMonth() + 1}월 ${targetDate.getDate()}일`;

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
  const movies = [...(upcomingQuery.data?.items ?? [])].sort((a, b) =>
    (a.releaseDate ?? "9999-12-31").localeCompare(
      b.releaseDate ?? "9999-12-31",
    ),
  );
  return (
    <SafeAreaView className="flex-1 bg-cinemo-bg">
      <CinemoBackground />

      <Header onSearchPress={() => router.push("/search")} />

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
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text style={{ color: CINEMO_COLORS.textSecondary }}>
                개봉 예정작이 없습니다.
              </Text>
            </View>
          }
          renderItem={({ item: movie }) => {
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
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
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
                  className="mt-3 text-base font-semibold"
                  style={{ color: CINEMO_COLORS.textPrimary }}
                >
                  {movie.title}
                </Text>

                <View className="mt-1 flex-row items-center gap-1">
                  <CalendarDays size={13} color={CINEMO_COLORS.textSecondary} />
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
