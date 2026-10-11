import {useMutation, useQueryClient} from "@tanstack/react-query";

import {deleteMovieRecord, updateMovieRecord, type UpdateMovieRecordInput,} from "@/lib/api/movies";
import {movieRecordQueryOptions} from "./movie-record.query";

export function useUpdateMovieRecord(movieId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMovieRecordInput) =>
      updateMovieRecord(movieId, input),
    onSuccess: (record) => {
      queryClient.setQueryData(
        movieRecordQueryOptions(movieId).queryKey,
        record,
      );
      queryClient.invalidateQueries({
        queryKey: ["my-cinema", "movies"],
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
        queryKey: movieRecordQueryOptions(movieId).queryKey,
      });
      
      queryClient.invalidateQueries({
        queryKey: ["my-cinema", "movies"],
      });
    },
  });
}