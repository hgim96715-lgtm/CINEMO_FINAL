import { queryOptions } from "@tanstack/react-query";
import {
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
  enabled?: boolean;
};

export const popularMoviesQueryOptions = ({
  page = 1,
  enabled = true,
}: PopularMoviesQueryOptions = {}) =>
  queryOptions({
    queryKey: ["movies", "popular", page],
    queryFn: ({ signal }) => getPopularMovies(page, signal),
    enabled,
    staleTime: 5 * 60_000,
  });
