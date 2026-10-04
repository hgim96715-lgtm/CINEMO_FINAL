import { queryOptions } from "@tanstack/react-query";
import { getPopularMovies } from "@/lib/api/movies";

type PopularMoviesQueryOptions = {
  page?: number;
  limit?: number;
  enabled?: boolean;
};

export const popularMoviesQueryOptions = ({
  page = 1,
  limit = 20,
  enabled = true,
}: PopularMoviesQueryOptions = {}) =>
  queryOptions({
    queryKey: ["movies", "popular", page, limit],
    queryFn: ({ signal }) => getPopularMovies(page, limit, signal),
    enabled,
    staleTime: 5 * 60_000,
  });
