import { queryOptions } from "@tanstack/react-query";

import {
  getMovieRecord,
} from "@/lib/api/movies";

export const movieRecordQueryOptions = (movieId: string) =>
  queryOptions({
    queryKey: ["movies", "record", movieId],
    queryFn: ({ signal }) => getMovieRecord(movieId, signal),
    enabled: movieId.length > 0,
    staleTime: 5 * 60_000,
  });
