import { queryOptions } from "@tanstack/react-query";
import {
  getMovieRankings,
  getPopularMovies,
  searchMovies,
  SearchMoviesParams,
} from "../api/movies";

export const movieSearchQueryOptions = (params: SearchMoviesParams) =>
  queryOptions({
    queryKey: ["movies", "search", params],
    queryFn: ({ signal }) => searchMovies(params, signal),
    enabled: params.query.trim().length > 0,
  });

type PopularMoviesQueryOptions = {
  page?: number;
  limit?: number;
  enabled?: boolean;
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
