import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getMovieNotification,
  subscribeMovieNotification,
  unsubscribeMovieNotification,
} from "@/lib/api/movies";

export const movieNotificationQueryOptions = (
  movieId: string,
  enabled = true,
) =>
  queryOptions({
    queryKey: ["movies", "notification", movieId],
    queryFn: () => getMovieNotification(movieId),
    enabled: enabled && movieId.length > 0,
  });

export const useMovieNotification = (movieId: string, enabled = true) => {
  return useQuery(movieNotificationQueryOptions(movieId, enabled));
};

export const useSubscribeMovieNotification = (movieId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => subscribeMovieNotification(movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: movieNotificationQueryOptions(movieId).queryKey,
      });
    },
  });
};

export const useUnsubscribeMovieNotification = (movieId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unsubscribeMovieNotification(movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: movieNotificationQueryOptions(movieId).queryKey,
      });
    },
  });
};
