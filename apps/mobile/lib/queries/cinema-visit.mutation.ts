import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCinemaVisit,
  CreateCinemaVisitInput,
  deleteCinemaVisit,
} from "@/lib/api/cinema-visits";
import { cinemaVisitKeys } from "@/lib/queries/cinema-visit.query";

export function useCreateCinemaVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCinemaVisitInput) => createCinemaVisit(input),
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({
        queryKey: cinemaVisitKeys.list(),
      });
      void queryClient.invalidateQueries({
        queryKey: cinemaVisitKeys.venue(input.venueId),
      });
    },
  });
}

export function useDeleteCinemaVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (visitId: string) => deleteCinemaVisit(visitId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: cinemaVisitKeys.all,
      });
    },
  });
}
