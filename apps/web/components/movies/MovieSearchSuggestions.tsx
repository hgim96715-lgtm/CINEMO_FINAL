"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  normalizeSearchText,
  movieSearchQueryOptions,
  popularMoviesQueryOptions,
  tmdbMovieSearchQueryOptions,
} from "@/lib/queries/movie-search.query";
import { importMovieFromTmdb } from "@/lib/api/movies";
import { useSearchStore } from "@/stores/search.store";
import { ApiErrorState } from "../common/ApiErrorState";
import { MovieSuggestionItem } from "./MovieSuggestionItem";

const hasKoreanTitle = (value: string) => /[가-힣0-9]/.test(value);

const getMovieSearchKey = (
  title: string,
  releaseDate: string | null | undefined,
) => `${normalizeSearchText(title)}:${releaseDate?.slice(0, 4) ?? ""}`;

type MovieSearchSuggestionsProps = {
  query: string;
};

export function MovieSearchSuggestions({ query }: MovieSearchSuggestionsProps) {
  const router = useRouter();
  const closeSearch = useSearchStore((state) => state.closeSearch);
  const keyword = query.trim();
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  useEffect(() => {
    if (!keyword) {
      setDebouncedKeyword("");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [keyword]);

  const popularQuery = useQuery(
    popularMoviesQueryOptions({
      page: 1,
      limit: 20,
      enabled: keyword.length === 0,
    }),
  );

  const searchQuery = useQuery(
    movieSearchQueryOptions({
      query: debouncedKeyword,
      page: 1,
      limit: 5,
    }),
  );
  const shouldFetchTmdb =
    searchQuery.isSuccess && searchQuery.data.items.length < 5;
  const tmdbQuery = useQuery(
    tmdbMovieSearchQueryOptions({
      query: debouncedKeyword,
      page: 1,
      enabled: shouldFetchTmdb,
    }),
  );

  const handleTmdbMovieSelect = async (tmdbMovieId: number) => {
    const movieId = await importMovieFromTmdb(tmdbMovieId);
    closeSearch();
    router.push(`/movies/${movieId}`);
  };

  if (!keyword) {
    if (popularQuery.isPending) {
      return <p>인기 영화를 불러오는 중...</p>;
    }

    if (popularQuery.isError) {
      return (
        <ApiErrorState
          message="인기 영화를 불러오지 못했습니다."
          onRetry={() => popularQuery.refetch()}
        />
      );
    }

    return (
      <ul className="grid gap-2 md:gap-3">
        {popularQuery.data?.items
          .filter((movie) => hasKoreanTitle(movie.title))
          .slice(0, 5)
          .map((movie) => (
            <MovieSuggestionItem
              key={movie.id}
              movie={movie}
              onSelect={closeSearch}
            />
          ))}
      </ul>
    );
  }

  if (!debouncedKeyword) {
    return null;
  }

  if (searchQuery.isPending) {
    return null;
  }

  if (searchQuery.isError) {
    return (
      <ApiErrorState
        message="검색 결과를 불러오지 못했습니다."
        onRetry={() => searchQuery.refetch()}
      />
    );
  }

  const dbMovies = searchQuery.data?.items ?? [];

  const dbMovieKeys = new Set(
    dbMovies.map((movie) =>
      getMovieSearchKey(movie.title, movie.releaseDate),
    ),
  );
  const tmdbMovies = (tmdbQuery.data?.results ?? [])
    .filter(
      (movie) =>
        !dbMovieKeys.has(
          getMovieSearchKey(movie.title, movie.release_date),
        ),
    )
    .slice(0, 5);

  if (shouldFetchTmdb && tmdbQuery.isPending && dbMovies.length === 0) {
    return <p className="px-2 py-3 text-sm text-white/50">영화를 찾는 중...</p>;
  }

  if (shouldFetchTmdb && tmdbQuery.isError && dbMovies.length === 0) {
    return (
      <ApiErrorState
        message="영화 검색 결과를 불러오지 못했습니다."
        onRetry={() => tmdbQuery.refetch()}
      />
    );
  }

  if (dbMovies.length === 0 && tmdbMovies.length === 0) {
    return (
      <p className="px-2 py-3 text-sm text-white/50">검색 결과가 없습니다.</p>
    );
  }

  return (
    <div className="grid gap-3">
      {dbMovies.length > 0 && (
        <ul className="grid gap-2 md:gap-3">
          {dbMovies.map((movie) => (
            <MovieSuggestionItem
              key={movie.id}
              movie={movie}
              onSelect={closeSearch}
            />
          ))}
        </ul>
      )}

      {tmdbMovies.length > 0 && (
        <div>
          <ul className="grid gap-2 md:gap-3">
            {tmdbMovies.map((movie) => {
              const posterPath =
                typeof movie.poster_path === "string"
                  ? movie.poster_path
                  : null;

              return (
                <li key={movie.id} className="overflow-hidden rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleTmdbMovieSelect(movie.id)}
                    className="flex w-full items-center gap-3 p-2 text-left transition hover:bg-white/10 md:gap-4 md:p-3"
                  >
                    {posterPath ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${posterPath}`}
                        alt={`${movie.title} 포스터`}
                        className="h-[60px] w-10 rounded-md object-cover md:h-24 md:w-16"
                      />
                    ) : (
                      <span className="flex h-[60px] w-10 items-center justify-center rounded-md bg-white/10 text-xs text-white/50 md:h-24 md:w-16">
                        없음
                      </span>
                    )}

                    <span className="min-w-0 truncate text-sm text-cinemo-text md:text-base">
                      {movie.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
