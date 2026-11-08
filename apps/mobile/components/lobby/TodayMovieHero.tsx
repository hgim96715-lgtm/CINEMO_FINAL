import { CINEMO_COLORS } from "@cinemo/shared";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ArrowUpRight, Sparkles } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { CachedImage } from "@/components/common/CachedImage";
import { getDailyMovie, getDailyMovieDay } from "@/lib/api/daily-movie";
import { currentUserQueryOptions, myMoviesQueryOptions } from "@/lib/queries/my-cinema.query";
import { popularMoviesQueryOptions } from "@/lib/queries/movie-popular.query";

export function TodayMovieHero() {
  const viewer = useQuery(currentUserQueryOptions());
  const today = useQuery({
    queryKey: ["daily-movie", viewer.data?.id ?? "guest", getDailyMovieDay()],
    queryFn: ({ signal }) => getDailyMovie(signal),
    enabled: !viewer.isPending,
    retry: false,
    staleTime: 5 * 60_000,
  });
  const records = useQuery(myMoviesQueryOptions(Boolean(viewer.data?.id)));
  const watchedIds = new Set(records.data?.filter((record) => record.isWatched).map((record) => record.movieId));
  const personal = Boolean(viewer.data?.id);
  const eligibleToday = today.data && !watchedIds.has(today.data.movie.id) ? today.data : null;
  const fallback = useQuery(popularMoviesQueryOptions({
    page: 1,
    limit: 20,
    enabled: !viewer.isPending && !viewer.isError && (!personal || records.isSuccess) &&
      (today.isError || (today.isSuccess && !eligibleToday)),
  }));
  const fallbackMovie = fallback.data?.items.find((movie) =>
    !watchedIds.has(movie.id) && movie.posterUrl && movie.title && !movie.isAdultOnly &&
    movie.releaseDate && movie.releaseDate <= getDailyMovieDay(),
  );
  const movie = !viewer.isError && (!personal || records.isSuccess)
    ? eligibleToday?.movie ?? fallbackMovie
    : undefined;
  const genres = movie?.genres.slice(0, 2).join("·");
  const reason = eligibleToday?.reason ?? (personal
    ? genres ? `아직 관람 기록이 없는 ${genres} 작품이에요.` : "관람 기록이 없는 작품에서 골랐어요."
    : genres ? `오늘 살펴볼 ${genres} 작품이에요.` : "개봉한 작품 중에서 골랐어요.");

  return (
    <View className="mx-5 mt-4 overflow-hidden rounded-3xl border border-cinemo-gold/25 bg-cinemo-surface px-4 py-4">
      <View className="flex-row items-center gap-2">
        <Sparkles size={16} color={CINEMO_COLORS.accentLight} />
        <Text className="text-xs font-semibold text-cinemo-gold-light">오늘의 영화</Text>
      </View>

      {movie ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${movie.title} 상세 보기`}
          onPress={() => router.push({ pathname: "/movies/[id]", params: { id: movie.id } })}
          className="mt-3 flex-row items-center gap-4"
        >
          <CachedImage
            source={{ uri: movie.posterUrl ?? undefined }}
            imageWidth={88}
            style={{ width: 88, height: 132, borderRadius: 12 }}
          />
          <View className="min-w-0 flex-1 gap-2">
            <Text numberOfLines={2} className="text-xl font-bold text-cinemo-text">{movie.title}</Text>
            <View className="gap-1">
              <Text className="text-xs font-semibold text-cinemo-gold-light">추천 이유</Text>
              <Text className="text-sm leading-5 text-cinemo-text">{reason}</Text>
            </View>
            {eligibleToday?.hasPreparedCopy && (
              <Text className="text-xs leading-4 text-cinemo-muted">{eligibleToday.copy}</Text>
            )}
            <View className="mt-1 flex-row items-center gap-1">
              <Text className="text-xs font-semibold text-cinemo-gold-light">영화 상세 보기</Text>
              <ArrowUpRight size={13} color={CINEMO_COLORS.accentLight} />
            </View>
          </View>
        </Pressable>
      ) : (viewer.isPending || (personal && records.isPending) || today.isFetching || fallback.isFetching) ? (
        <View className="h-32 items-center justify-center">
          <ActivityIndicator color={CINEMO_COLORS.accentLight} />
        </View>
      ) : (
        <Text className="mt-4 text-sm text-cinemo-muted">{viewer.isError || (personal && records.isError) ? "관람 기록을 확인하지 못했어요." : "아직 보지 않은 추천 영화를 찾지 못했어요."}</Text>
      )}
    </View>
  );
}
