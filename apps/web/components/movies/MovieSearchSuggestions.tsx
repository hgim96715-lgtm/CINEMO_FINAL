"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  popularMoviesQueryOptions,
  hasMovieTitleMatch,
  useMovieSearchWithTmdbFallback,
} from "@/lib/queries/movie-search.query";
import { importMovieFromTmdb } from "@/lib/api/movies";
import { useSearchStore } from "@/stores/search.store";
import { ApiErrorState } from "../common/ApiErrorState";
import { MovieSuggestionItem } from "./MovieSuggestionItem";

type MovieSearchSuggestionsProps = {
  query: string;
};

export function MovieSearchSuggestions({ query }: MovieSearchSuggestionsProps) {
  const router = useRouter();
  const closeSearch = useSearchStore((state) => state.closeSearch);
  const keyword = query.trim();

  const popularQuery = useQuery(
    popularMoviesQueryOptions({
      page: 1,
      enabled: keyword.length === 0,
    }),
  );

  const { dbQuery: searchQuery, tmdbQuery } =
    useMovieSearchWithTmdbFallback({
      query: keyword,
      page: 1,
      limit: 5,
    });

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
        {popularQuery.data?.items.slice(0, 5).map((movie) => (
          <MovieSuggestionItem
            key={movie.id}
            movie={movie}
            onSelect={closeSearch}
          />
        ))}
      </ul>
    );
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

  if (
    searchQuery.data?.items.length &&
    hasMovieTitleMatch(searchQuery.data.items, keyword)
  ) {
    return (
      <ul className="grid gap-2 md:gap-3">
        {searchQuery.data.items.map((movie) => (
          <MovieSuggestionItem
            key={movie.id}
            movie={movie}
            onSelect={closeSearch}
          />
        ))}
      </ul>
    );
  }

  if (tmdbQuery.isPending) {
    return <p className="px-2 py-3 text-sm text-white/50">영화를 찾는 중...</p>;
  }

  if (tmdbQuery.isError) {
    return (
      <ApiErrorState
        message="영화 검색 결과를 불러오지 못했습니다."
        onRetry={() => tmdbQuery.refetch()}
      />
    );
  }

  const tmdbMovies = tmdbQuery.data?.results ?? [];

  if (tmdbMovies.length === 0) {
    return <p className="px-2 py-3 text-sm text-white/50">검색 결과가 없습니다.</p>;
  }

  return (
    <ul className="grid gap-2 md:gap-3">
      {tmdbMovies.slice(0, 5).map((movie) => {
        const posterPath =
          typeof movie.poster_path === "string" ? movie.poster_path : null;

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
  );
}
