import { queryOptions } from "@tanstack/react-query";
import {
  searchMovies,
  searchUnified,
  getTmdbMovieDetail,
  searchTmdbMovies,
  type SearchMoviesParams,
} from "@/lib/api/movies";

export const unifiedSearchQueryOptions = (params: SearchMoviesParams) =>
  queryOptions({
    queryKey: ["search", "unified", params],
    queryFn: ({ signal }) => searchUnified(params, signal),
    enabled: params.query.trim().length > 0,
    staleTime: 60_000,
  });

export const movieSearchQueryOptions = (params: SearchMoviesParams) =>
  queryOptions({
    queryKey: ["movies", "search", params],
    queryFn: ({ signal }) => searchMovies(params, signal),
    enabled: params.query.trim().length > 0,
  });

export type TmdbMovieSearchParams = {
  query: string;
  page?: number;
  enabled?: boolean;
};

export const normalizeSearchText = (value: string) =>
  value.normalize("NFKC").toLocaleLowerCase().replace(/[\s\p{P}]+/gu, "");

export function getMovieSearchVariants(query: string): string[] {
  const normalized = normalizeSearchText(query);
  if (normalized === "그린") return [query, "그린치"];
  if (["스크루지", "스크로지", "스크루즈", "scrooge"].includes(normalized)) {
    return [...new Set([query, "스크루지", "Scrooge"])];
  }
  return [query];
}

export function movieTitleMatchRank(title: string, query: string) {
  const normalizedTitle = normalizeSearchText(title);
  const [keyword, ...variants] = getMovieSearchVariants(query).map(normalizeSearchText);
  if (!keyword) return 0;
  if (normalizedTitle === keyword) return 4;
  if (variants.some((variant) => normalizedTitle === variant)) return 3;
  if ([keyword, ...variants].some((variant) => normalizedTitle.startsWith(variant))) return 2;
  if ([keyword, ...variants].some((variant) => normalizedTitle.includes(variant))) return 1;
  return 0;
}

export const hasExactMovieTitleMatch = (
  movies: Array<{ title: string }>,
  query: string,
) => {
  const normalizedQuery = normalizeSearchText(query);

  return movies.some(
    (movie) => normalizeSearchText(movie.title) === normalizedQuery,
  );
};

export const getMovieSearchKey = (
  title: string,
  releaseDate: string | null | undefined,
) => `${normalizeSearchText(title)}:${releaseDate?.slice(0, 4) ?? ""}`;

export const tmdbMovieSearchQueryOptions = ({
  query,
  page = 1,
  enabled = true,
}: TmdbMovieSearchParams) =>
  queryOptions({
    queryKey: ["tmdb", "movies", "search", query, page],
    queryFn: async ({ signal }) => {
      const variants = getMovieSearchVariants(query);
      if (variants.length === 1) return searchTmdbMovies(query, page, signal);

      const responses = await Promise.allSettled(
        variants.map((variant) => searchTmdbMovies(variant, page, signal)),
      );
      const [first, ...rest] = responses.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );
      if (!first) {
        const failed = responses.find((result) => result.status === "rejected");
        throw failed?.reason ?? new Error("영화 검색에 실패했습니다.");
      }

      const movies = new Map(first.results.map((movie) => [movie.id, movie]));
      for (const response of rest) {
        for (const movie of response.results) {
          if (!movies.has(movie.id)) movies.set(movie.id, movie);
        }
      }
      return { ...first, results: [...movies.values()] };
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 5 * 60_000,
  });

export const tmdbMovieDetailQueryOptions = (tmdbMovieId: number) =>
  queryOptions({
    queryKey: ["tmdb", "movies", "detail", tmdbMovieId],
    queryFn: ({ signal }) => getTmdbMovieDetail(tmdbMovieId, signal),
    staleTime: 30 * 60_000,
  });
