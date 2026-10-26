import { queryOptions } from "@tanstack/react-query";

import { getMovieRecord } from "@/lib/api/movie-records";

export const movieRecordKeys = {
  all: ["movies", "record"] as const,
  detail: (movieId: string) => [...movieRecordKeys.all, movieId] as const,
};

export const movieRecordQueryOptions = (
  movieId: string,
  enabled = true,
) =>
  queryOptions({
    queryKey: movieRecordKeys.detail(movieId),
    queryFn: ({ signal }) => getMovieRecord(movieId, signal),
    enabled: enabled && movieId.trim().length > 0,
    staleTime: 5 * 60_000,
  });
