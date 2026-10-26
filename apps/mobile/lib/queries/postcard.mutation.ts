import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setPostcardHeart, sharePostcard } from "@/lib/api/postcards";
import { postcardDetailQueryOptions } from "@/lib/queries/postcard-detail.query";
import { postcardFeedQueryOptions } from "@/lib/queries/postcard-feed.query";

export function useSetPostcardHeart(postcardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isReacted: boolean) =>
      setPostcardHeart(postcardId, isReacted),

    retry: false,

    onSuccess: (data) => {
      queryClient.setQueryData(
        postcardDetailQueryOptions(postcardId).queryKey,
        (postcard) =>
          postcard
            ? {
                ...postcard,
                hasReacted: data.reacted,
                reactionCount: data.reactionCount,
              }
            : postcard,
      );

      void queryClient.invalidateQueries({
        queryKey: postcardFeedQueryOptions().queryKey,
      });
    },
  });
}

export function useSharePostcard(postcardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channel: string) => sharePostcard(postcardId, channel),

    onSuccess: (data) => {
      queryClient.setQueryData(
        postcardDetailQueryOptions(postcardId).queryKey,
        (postcard) =>
          postcard
            ? {
                ...postcard,
                shareCount: data.shareCount,
              }
            : postcard,
      );

      void queryClient.invalidateQueries({
        queryKey: postcardFeedQueryOptions().queryKey,
      });
    },
  });
}
