import { queryOptions } from "@tanstack/react-query";

import {
  getMovieGenreAnalytics,
  type MovieGenreAnalyticsParams,
} from "../api/movies";

export type MovieGenreAnalyticsQueryOptionsParams =
  MovieGenreAnalyticsParams & {
    enabled?: boolean;
  };

export const movieGenreAnalyticsQueryOptions = ({
  year,
  month,
  enabled = true,
}: MovieGenreAnalyticsQueryOptionsParams) =>
  queryOptions({
    queryKey: ["movies", "analytics", "genres", year, month],
    queryFn: ({ signal }) => getMovieGenreAnalytics({ year, month }, signal),
    enabled,
  });
