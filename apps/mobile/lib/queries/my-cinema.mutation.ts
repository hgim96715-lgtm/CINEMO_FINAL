import { useMutation, useQueryClient } from "@tanstack/react-query";

import { unsubscribeMovieNotification } from "@/lib/api/movie-notifications";

import { myCinemaKeys } from "./my-cinema.query";

export function useUnsubscribeMyMovieNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieId: string) =>
      unsubscribeMovieNotification(movieId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: myCinemaKeys.notifications(),
      });
    },
  });
}
