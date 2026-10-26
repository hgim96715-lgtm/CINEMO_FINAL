import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  deleteMovieRecord,
  updateMovieRecord,
  type UpdateMovieRecordInput,
} from "@/lib/api/movie-records";

import { myCinemaKeys } from "./my-cinema.query";
import { movieRecordKeys } from "./movie-record.query";

export function useUpdateMovieRecord(movieId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMovieRecordInput) =>
      updateMovieRecord(movieId, input),
    onSuccess: (record) => {
      queryClient.setQueryData(movieRecordKeys.detail(movieId), record);
      void queryClient.invalidateQueries({
        queryKey: myCinemaKeys.movies(),
      });
      void queryClient.invalidateQueries({
        queryKey: ["my-cinema", "calendar"],
      });
    },
  });
}

export function useDeleteMovieRecord(movieId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteMovieRecord(movieId),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: movieRecordKeys.detail(movieId),
      });
      void queryClient.invalidateQueries({
        queryKey: myCinemaKeys.movies(),
      });
      void queryClient.invalidateQueries({
        queryKey: ["my-cinema", "calendar"],
      });
    },
  });
}
