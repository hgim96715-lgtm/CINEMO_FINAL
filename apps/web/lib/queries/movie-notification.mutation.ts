import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  subscribeMovieNotification,
  unsubscribeMovieNotification,
} from "@/lib/api/movies";
import { movieNotificationQueryOptions } from "./movie-notification.query";

export function useSubscribeMovieNotification(movieId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => subscribeMovieNotification(movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: movieNotificationQueryOptions(movieId).queryKey,
      });
    },
  });
}

export function useUnsubscribeMovieNotification(movieId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unsubscribeMovieNotification(movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: movieNotificationQueryOptions(movieId).queryKey,
      });
    },
  });
}
