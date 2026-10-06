import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  getMovieRankings,
  getPopularMovies,
  getUpcomingMovies,
  searchMovies,
  SearchMoviesParams,
  searchTmdbMovies,
  UpcomingMoviesParams,
} from "../api/movies";

export const movieSearchQueryOptions = ({
  query,
  page = 1,
  limit = 10,
  enabled = true,
}: SearchMoviesParams & { enabled?: boolean }) =>
  queryOptions({
    queryKey: ["movies", "search", query, page, limit],
    queryFn: ({ signal }) => searchMovies({ query, page, limit }, signal),
    enabled: enabled && query.trim().length > 0,
  });

type PopularMoviesQueryOptions = {
  page?: number;
  limit?: number;
  enabled?: boolean;
};

type TmdbMovieSearchQueryOptions = {
  query: string;
  page?: number;
  enabled?: boolean;
};

export const normalizeSearchText = (value: string) =>
  value.toLocaleLowerCase().replace(/\s+/g, "");

export const hasMovieTitleMatch = (
  movies: Array<{ title: string }>,
  query: string,
) => {
  const normalizedQuery = normalizeSearchText(query);

  return movies.some((movie) =>
    normalizeSearchText(movie.title).includes(normalizedQuery),
  );
};

export const tmdbMovieSearchQueryOptions = ({
  query,
  page = 1,
  enabled = true,
}: TmdbMovieSearchQueryOptions) =>
  queryOptions({
    queryKey: ["tmdb", "movies", "search", query, page],
    queryFn: ({ signal }) => searchTmdbMovies(query, page, signal),
    enabled: enabled && query.trim().length > 0,
    staleTime: 5 * 60_000,
  });

export const useMovieSearchWithTmdbFallback = (params: SearchMoviesParams) => {
  const dbQuery = useQuery(movieSearchQueryOptions(params));
  const dbLimit = params.limit ?? 10;
  const shouldFetchTmdb =
    dbQuery.isSuccess && dbQuery.data.items.length < dbLimit;

  const tmdbQuery = useQuery(
    tmdbMovieSearchQueryOptions({
      query: params.query,
      page: params.page,
      enabled: shouldFetchTmdb,
    }),
  );

  return {
    dbQuery,
    tmdbQuery,
    shouldFetchTmdb,
  };
};

export const popularMoviesQueryOptions = ({
  page = 1,
  limit = 10,
  enabled = true,
}: PopularMoviesQueryOptions = {}) =>
  queryOptions({
    queryKey: ["movies", "popular", page, limit],
    queryFn: ({ signal }) => getPopularMovies(page, limit, signal),
    enabled,
    staleTime: 5 * 60_000,
  });

export const movieRankingQueryOptions = ({
  page = 1,
  limit = 10,
  enabled = true,
}: PopularMoviesQueryOptions = {}) =>
  queryOptions({
    queryKey: ["movies", "rankings", page, limit],
    queryFn: ({ signal }) => getMovieRankings(page, limit, signal),
    enabled,
    staleTime: 5 * 60_000,
  });

export const upcomingMoviesQueryOptions = ({
  period,
  yearMonth,
  page = 1,
  limit = 10,
  enabled = true,
}: UpcomingMoviesParams & { enabled?: boolean } = {}) =>
  queryOptions({
    queryKey: [
      "movies",
      "upcoming",
      period ?? null,
      yearMonth ?? null,
      page,
      limit,
    ],
    queryFn: ({ signal }) =>
      getUpcomingMovies(
        {
          period,
          yearMonth,
          page,
          limit,
        },
        signal,
      ),
    enabled,
    staleTime: 5 * 60_000,
  });
