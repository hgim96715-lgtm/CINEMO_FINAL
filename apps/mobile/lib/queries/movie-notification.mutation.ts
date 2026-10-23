import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  subscribeMovieNotification,
  unsubscribeMovieNotification,
} from "@/lib/api/movie-notifications";

import { movieNotificationKeys } from "./movie-notification.query";

export function useMovieNotificationMutation(movieId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isEnabled: boolean) => {
      if (isEnabled) {
        return unsubscribeMovieNotification(movieId);
      }

      return subscribeMovieNotification(movieId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: movieNotificationKeys.detail(movieId),
      });
    },
  });
}
