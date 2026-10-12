"use client";

import {useQuery} from "@tanstack/react-query";
import type {MovieResponse} from "@cinemo/api-contract";
import {useRouter} from "next/navigation";
import {useEffect} from "react";

import {movieDetailQueryOptions} from "@/lib/queries/movie-detail.query";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cinemo-bg/70 px-6 backdrop-blur-sm">
      <div className="rounded-2xl bg-cinemo-surface/95 px-6 py-5 text-center shadow-2xl">
        <p className="text-sm font-medium text-cinemo-text">
          영화 정보를 불러오는 중...
        </p>
        <p className="mt-2 text-xs text-cinemo-muted">
          잠시만 기다리면 상세 정보가 표시됩니다.
        </p>
      </div>
    </div>
  );
}
