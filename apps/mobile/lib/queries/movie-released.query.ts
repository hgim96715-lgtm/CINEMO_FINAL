import { getReleasedMovies, ReleasedMoviesParams } from "@/lib/api/movies";
import { queryOptions } from "@tanstack/react-query";

type MovieReleasedQueryOptions = ReleasedMoviesParams & { enabled?: boolean };

export const movieReleasedQueryOptions = ({
  yearMonth,
  page = 1,
  limit = 10,
  enabled = true,
}: MovieReleasedQueryOptions = {}) =>
  queryOptions({
    queryKey: ["movies", "released", yearMonth ?? null, page, limit],
    queryFn: ({ signal }) =>
      getReleasedMovies({ yearMonth, page, limit }, signal),
    enabled,
    staleTime: 5 * 60_000,
  });
