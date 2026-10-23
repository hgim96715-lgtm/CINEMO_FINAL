import { queryOptions } from "@tanstack/react-query";
import { getMovieNotification } from "@/lib/api/movie-notifications";

export const movieNotificationKeys = {
  all: ["movies", "notification"] as const,
  detail: (movieId: string) => [...movieNotificationKeys.all, movieId] as const,
};

export const movieNotificationQueryOptions = (
  movieId: string,
  enabled: boolean,
) =>
  queryOptions({
    queryKey: movieNotificationKeys.detail(movieId),
    queryFn: ({ signal }) => getMovieNotification(movieId, signal),
    enabled: enabled && movieId.trim().length > 0,
  });
