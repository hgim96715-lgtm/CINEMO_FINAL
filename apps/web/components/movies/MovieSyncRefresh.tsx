"use client";

import { useQuery } from "@tanstack/react-query";
import type { MovieResponse } from "@cinemo/api-contract";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { movieDetailQueryOptions } from "@/lib/queries/movie-detail.query";

type MovieSyncRefreshProps = {
  movieId: string;
};

const isMovieEnriched = (movie: MovieResponse | null | undefined): boolean =>
  Boolean(
    movie &&
      (movie.overview ||
        movie.genres.length > 0 ||
        movie.credits.length > 0 ||
        movie.media.length > 1 ||
        movie.watchOptions.length > 0),
  );

export function MovieSyncRefresh({ movieId }: MovieSyncRefreshProps) {
  const router = useRouter();
  const movieQuery = useQuery({
    ...movieDetailQueryOptions(movieId),
    refetchInterval: (query) =>
      isMovieEnriched(query.state.data) ? false : 1_000,
  });

  useEffect(() => {
    if (!isMovieEnriched(movieQuery.data)) {
      return;
    }

    router.refresh();
    const timeoutId = window.setTimeout(() => {
      router.replace(`/movies/${movieId}`, { scroll: false });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [movieId, movieQuery.data, router]);

  return (
    <p className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-cinemo-surface/95 px-4 py-2 text-xs text-cinemo-muted shadow-lg backdrop-blur">
      영화 정보를 보완하는 중...
    </p>
  );
}
