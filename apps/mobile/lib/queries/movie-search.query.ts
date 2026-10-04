import { queryOptions } from "@tanstack/react-query";
import { searchMovies, type SearchMoviesParams } from "@/lib/api/movies";

export const movieSearchQueryOptions = (params: SearchMoviesParams) =>
  queryOptions({
    queryKey: ["movies", "search", params],
    queryFn: ({ signal }) => searchMovies(params, signal),
    enabled: params.query.trim().length > 0,
  });
