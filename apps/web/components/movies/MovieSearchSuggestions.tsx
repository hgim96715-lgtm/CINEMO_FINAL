"use client";

import { useQuery } from "@tanstack/react-query";

import {
  movieSearchQueryOptions,
  popularMoviesQueryOptions,
} from "@/lib/queries/movie-search.query";
import { useSearchStore } from "@/stores/search.store";
import { ApiErrorState } from "../common/ApiErrorState";
import { MovieSuggestionItem } from "./MovieSuggestionItem";

type MovieSearchSuggestionsProps = {
  query: string;
};

export function MovieSearchSuggestions({ query }: MovieSearchSuggestionsProps) {
  const closeSearch = useSearchStore((state) => state.closeSearch);
  const keyword = query.trim();

  const popularQuery = useQuery(
    popularMoviesQueryOptions({
      page: 1,
      enabled: keyword.length === 0,
    }),
  );

  const searchQuery = useQuery(
    movieSearchQueryOptions({
      query: keyword,
      page: 1,
      limit: 5,
    }),
  );

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

  if (searchQuery.data?.items.length === 0) {
    return null;
  }

  return (
    <ul className="grid gap-2 md:gap-3">
      {searchQuery.data?.items.map((movie) => (
        <MovieSuggestionItem
          key={movie.id}
          movie={movie}
          onSelect={closeSearch}
        />
      ))}
    </ul>
  );
}
