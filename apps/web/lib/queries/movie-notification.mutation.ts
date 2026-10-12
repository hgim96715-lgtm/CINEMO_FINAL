import {useMutation, useQueryClient} from "@tanstack/react-query";

import {
  subscribeMovieNotification,
  unsubscribeMovieNotification,
} from "@/lib/api/movies";
import type {MovieNotificationItem} from "@/lib/api/movies";
import {movieNotificationQueryOptions, myMovieNotificationsQueryOptions} from "./movie-notification.query";

export function useSubscribeMovieNotification(movieId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => subscribeMovieNotification(movieId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: movieNotificationQueryOptions(movieId).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: myMovieNotificationsQueryOptions().queryKey,
        }),
      ]);
    },
  });
}

export function useUnsubscribeMovieNotification(movieId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unsubscribeMovieNotification(movieId),

    onMutate: async () => {
      const notificationsKey =
        myMovieNotificationsQueryOptions().queryKey;

      await queryClient.cancelQueries({
        queryKey: notificationsKey,
      });

      const previousNotifications =
        queryClient.getQueryData<MovieNotificationItem[]>(
          notificationsKey,
        );

      queryClient.setQueryData<MovieNotificationItem[]>(
        notificationsKey,
        (notifications) =>
          notifications?.filter(
            (notification) => notification.movieId !== movieId,
          ) ?? [],
      );

      return {previousNotifications};
    },

    onError: (_error, _variables, context) => {
      if (!context?.previousNotifications) {
        return;
      }

      queryClient.setQueryData(
        myMovieNotificationsQueryOptions().queryKey,
        context.previousNotifications,
      );
    },

    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: movieNotificationQueryOptions(movieId).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: myMovieNotificationsQueryOptions().queryKey,
        }),
      ]);
    },
  });
}
