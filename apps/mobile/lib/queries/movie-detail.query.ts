import { queryOptions } from "@tanstack/react-query";
import { getMovie } from "@/lib/api/movies";

export const movieDetailQueryOptions = (movieId: string) =>
  queryOptions({
    queryKey: ["movies", "detail", movieId],
    queryFn: ({ signal }) => getMovie(movieId, signal),
    enabled: movieId.trim().length > 0,
  });
