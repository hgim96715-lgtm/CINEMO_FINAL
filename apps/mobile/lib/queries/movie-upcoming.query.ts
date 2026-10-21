import { getUpcomingMovies, UpcomingMoviesParams } from "@/lib/api/movies";
import { queryOptions } from "@tanstack/react-query";

type MovieUpcomingQueryOptions = UpcomingMoviesParams & {
  enabled?: boolean;
};

export const movieUpcomingQueryOptions = ({
  period,
  yearMonth,
  page = 1,
  limit = 10,
  enabled = true,
}: MovieUpcomingQueryOptions = {}) =>
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
      getUpcomingMovies({ period, yearMonth, page, limit }, signal),
    enabled,
    staleTime: 5 * 60_000,
  });
