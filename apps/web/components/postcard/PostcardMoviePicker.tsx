"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

import { AppModal } from "@/components/ui/app-modal";
import { importMovieFromTmdb } from "@/lib/api/movies";
import {
  movieSearchQueryOptions,
  normalizeSearchText,
  tmdbMovieSearchQueryOptions,
} from "@/lib/queries/movie-search.query";

type PostcardMoviePickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (movieId: string) => void;
};

export function PostcardMoviePicker({
  open,
  onOpenChange,
  onSelect,
}: PostcardMoviePickerProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [importingTmdbId, setImportingTmdbId] = useState<number | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const movieQuery = useQuery(
    movieSearchQueryOptions({
      query: debouncedQuery,
      page: 1,
      limit: 10,
    }),
  );

  const tmdbQuery = useQuery(
    tmdbMovieSearchQueryOptions({
      query: debouncedQuery,
      page: 1,
      enabled: movieQuery.isSuccess && movieQuery.data.items.length < 10,
    }),
  );

  const movies = movieQuery.data?.items ?? [];
  const tmdbMovies = (tmdbQuery.data?.results ?? []).filter(
    (movie, index, results) => {
      const normalizedTitle = normalizeSearchText(movie.title);

      return (
        results.findIndex(
          (candidate) =>
            normalizeSearchText(candidate.title) === normalizedTitle,
        ) === index
      );
    },
  );

  const tmdbPosterByTitle = new Map(
    tmdbMovies
      .filter((movie) => movie.poster_path)
      .map((movie) => [
        normalizeSearchText(movie.title),
        `https://image.tmdb.org/t/p/w185${movie.poster_path}`,
      ]),
  );

  const moviesWithPosterFallback = movies.map((movie) => ({
    ...movie,
    posterUrl:
      movie.posterUrl ??
      tmdbPosterByTitle.get(normalizeSearchText(movie.title)) ??
      null,
  }));

  const localMovieTitles = new Set(
    movies.map((movie) => normalizeSearchText(movie.title)),
  );

  const tmdbMoviesWithoutLocalDuplicate = tmdbMovies.filter(
    (movie) => !localMovieTitles.has(normalizeSearchText(movie.title)),
  );

  const resultCount =
    moviesWithPosterFallback.length + tmdbMoviesWithoutLocalDuplicate.length;
  const shouldScroll = resultCount > 3;

  const selectMovie = (movieId: string) => {
    onOpenChange(false);
    onSelect(movieId);
  };

  const selectTmdbMovie = async (tmdbMovieId: number) => {
    if (importingTmdbId !== null) {
      return;
    }

    setImportingTmdbId(tmdbMovieId);

    try {
      const movieId = await importMovieFromTmdb(tmdbMovieId);
      selectMovie(movieId);
    } finally {
      setImportingTmdbId(null);
    }
  };

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="엽서를 남길 영화 선택"
      description="영화를 검색하고 포스터를 확인한 뒤 엽서를 만들어보세요."
      className="w-[calc(100%-2rem)] sm:max-w-lg"
    >
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="영화 제목을 검색하세요"
        autoFocus
        className="w-full rounded-xl border  bg-white/5 px-4 py-3 text-sm  outline-none placeholder:text-cinemo-muted focus:border-cinemo-gold"
      />

      <div
        className={`mt-4 space-y-2 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          shouldScroll ? "max-h-[17.5rem] overflow-y-auto" : ""
        }`}
      >
        {!debouncedQuery && (
          <p className="py-8 text-center text-sm text-cinemo-muted">
            엽서를 만들 영화를 검색하세요.
          </p>
        )}

        {debouncedQuery && movieQuery.isPending && (
          <p className="py-8 text-center text-sm text-cinemo-muted">
            영화를 찾는 중...
          </p>
        )}

        {moviesWithPosterFallback.map((movie) => (
          <button
            key={movie.id}
            type="button"
            onClick={() => selectMovie(movie.id)}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/10"
          >
            {movie.posterUrl ? (
              <Image
                src={movie.posterUrl}
                alt={`${movie.title} 포스터`}
                width={48}
                height={72}
                className="h-18 w-12 rounded-md object-cover"
              />
            ) : (
              <span className="flex h-18 w-12 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs text-cinemo-muted">
                없음
              </span>
            )}

            <span className="min-w-0 truncate text-sm text-cinemo-text">
              {movie.title}
            </span>
          </button>
        ))}

        {debouncedQuery &&
          movieQuery.isSuccess &&
          movies.length === 0 &&
          tmdbQuery.isPending && (
            <p className="py-4 text-center text-sm text-cinemo-muted">
              외부 영화 정보를 찾는 중...
            </p>
          )}

        {tmdbMoviesWithoutLocalDuplicate.map((movie) => (
          <button
            key={movie.id}
            type="button"
            onClick={() => selectTmdbMovie(movie.id)}
            disabled={importingTmdbId !== null}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/10 disabled:opacity-60"
          >
            {movie.poster_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                alt={`${movie.title} 포스터`}
                width={48}
                height={72}
                className="h-18 w-12 rounded-md object-cover"
              />
            ) : (
              <span className="flex h-18 w-12 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs text-cinemo-muted">
                없음
              </span>
            )}

            <span className="min-w-0 truncate text-sm text-cinemo-text">
              {importingTmdbId === movie.id
                ? "영화 불러오는 중..."
                : movie.title}
            </span>
          </button>
        ))}

        {debouncedQuery &&
          movieQuery.isSuccess &&
          tmdbQuery.isSuccess &&
          movies.length === 0 &&
          tmdbMoviesWithoutLocalDuplicate.length === 0 && (
            <p className="py-8 text-center text-sm text-cinemo-muted">
              검색 결과가 없습니다.
            </p>
          )}
      </div>
    </AppModal>
  );
}
