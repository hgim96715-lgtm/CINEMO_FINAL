import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createAdminCuration,
  deleteAdminCuration,
  updateAdminCuration,
  type SaveCurationInput,
} from "@/lib/api/curations";

export function useCreateAdminCurationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdminCuration,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "curations"] });
      void queryClient.invalidateQueries({ queryKey: ["curations", "active"] });
    },
  });
}

export function useUpdateAdminCurationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SaveCurationInput }) =>
      updateAdminCuration(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "curations"] });
      void queryClient.invalidateQueries({ queryKey: ["curations", "active"] });
    },
  });
}

export function useDeleteAdminCurationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAdminCuration,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "curations"] });
      void queryClient.invalidateQueries({ queryKey: ["curations", "active"] });
    },
  });
}
