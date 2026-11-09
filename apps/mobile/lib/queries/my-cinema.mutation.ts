import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  type UpdateMyProfileInput,
  updateMyProfile,
} from "@/lib/api/my-cinema";
import { unsubscribeMovieNotification } from "@/lib/api/movie-notifications";

import { myCinemaKeys } from "./my-cinema.query";

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMyProfileInput) => updateMyProfile(input),
    onSuccess: async (updatedUser) => {
      await queryClient.cancelQueries({ queryKey: myCinemaKeys.user() });
      queryClient.setQueryData(myCinemaKeys.user(), updatedUser);
    },
  });
}

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
