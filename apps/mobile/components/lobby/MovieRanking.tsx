import { useQuery } from "@tanstack/react-query";
import { CINEMO_COLORS } from "@cinemo/shared";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { movieRankingQueryOptions } from "@/lib/queries/movie-ranking.query";

import { MovieHero } from "./MovieHero";
import { MovieCard } from "./MovieCard";
import { popularMoviesQueryOptions } from "@/lib/queries/movie-popular.query";
import { MovieTrailerDialog } from "./MovieTrailerDialog";
import { movieDetailQueryOptions } from "@/lib/queries/movie-detail.query";

type MovieRankingProps = {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export function MovieRanking({ onScroll }: MovieRankingProps) {
  const [trailerMovieId, setTrailerMovieId] = useState<string | null>(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  const rankingQuery = useQuery(
    movieRankingQueryOptions({ page: 1, limit: 10 }),
  );
  const popularQuery = useQuery(
    popularMoviesQueryOptions({ page: 1, limit: 20 }),
  );

  const trailerQuery = useQuery(movieDetailQueryOptions(trailerMovieId ?? ""));

  const hasKorean = (value: string) => /[가-힣0-9]/.test(value);

  const heroMovie = useMemo(() => {
    const heroMovies =
      popularQuery.data?.items.filter(
        (movie) => hasKorean(movie.title) && movie.hasTrailer,
      ) ?? [];

    if (heroMovies.length === 0) return null;

    return heroMovies[Math.floor(Math.random() * heroMovies.length)];
  }, [popularQuery.data?.items]);

  const movies = rankingQuery.data?.items ?? [];

  const trailerMedia = trailerQuery.data?.media.find(
    (media) => media.mediaType === "TRAILER" && Boolean(media.externalId),
  );

  if (rankingQuery.isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={CINEMO_COLORS.accent} />
      </View>
    );
  }

  if (rankingQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center px-5">
        <Text style={{ color: CINEMO_COLORS.textPrimary }}>
          영화 순위를 불러오지 못했습니다.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View className="px-5">
          <View className="pt-6">
            <MovieHero
              movie={heroMovie ?? undefined}
              onTrailerPress={() => {
                if (!heroMovie) return;

                setTrailerMovieId(heroMovie.id);
                setIsTrailerOpen(true);
              }}
              onDetailPress={() => {
                if (!heroMovie) return;

                router.push(`/movies/${heroMovie.id}`);
              }}
            />
          </View>

          <View className="mb-5 mt-10">
            <Text
              className="text-xs font-semibold tracking-[4px]"
              style={{ color: CINEMO_COLORS.accentLight }}
            >
              CINEMO RANKING
            </Text>

            <Text
              className="mt-2 text-2xl font-bold"
              style={{ color: CINEMO_COLORS.textPrimary }}
            >
              오늘의 영화 순위
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ height: 290 }}
          contentContainerClassName="px-5 pb-4"
        >
          <View className="flex-row">
            {movies.map((movie, index) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                index={index}
                onPress={() => router.push(`/movies/${movie.id}`)}
              />
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      <MovieTrailerDialog
        open={isTrailerOpen}
        videoKey={trailerMedia?.externalId ?? null}
        title={
          trailerQuery.data?.titles.find(
            (title) => title.titleType === "PRIMARY",
          )?.title ??
          heroMovie?.title ??
          "영화"
        }
        onOpenChange={(open) => {
          setIsTrailerOpen(open);

          if (!open) {
            setTrailerMovieId(null);
          }
        }}
      />
    </>
  );
}
