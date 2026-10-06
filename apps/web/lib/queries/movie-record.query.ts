import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getMovieRecord,
  updateMovieRecord,
  type UpdateMovieRecordInput,
} from "@/lib/api/movies";

export const movieRecordQueryOptions = (movieId: string, enabled = true) =>
  queryOptions({
    queryKey: ["movies", "record", movieId],
    queryFn: () => getMovieRecord(movieId),
    enabled: enabled && movieId.length > 0,
  });

export const useMovieRecord = (movieId: string, enabled = true) => {
  return useQuery(movieRecordQueryOptions(movieId, enabled));
};

export const useUpdateMovieRecord = (movieId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateMovieRecordInput) =>
      updateMovieRecord(movieId, input),

    onSuccess: (record) => {
      queryClient.setQueryData(
        movieRecordQueryOptions(movieId).queryKey,
        record,
      );
    },
  });
};
