import { queryOptions } from "@tanstack/react-query";

import { getMovieRankings } from "@/lib/api/movies";

type MovieRankingQueryOptions = {
  page?: number;
  limit?: number;
  enabled?: boolean;
};

export const movieRankingQueryOptions = ({
  page = 1,
  limit = 10,
  enabled = true,
}: MovieRankingQueryOptions = {}) =>
  queryOptions({
    queryKey: ["movies", "rankings", page, limit],
    queryFn: ({ signal }) => getMovieRankings(page, limit, signal),
    enabled,
    staleTime: 5 * 60_000,
  });
