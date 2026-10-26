import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createPostcardComment,
  type PostcardComment,
} from "@/lib/api/postcard-comments";
import { postcardCommentsQueryOptions } from "@/lib/queries/postcard-comment.query";
import { postcardDetailQueryOptions } from "@/lib/queries/postcard-detail.query";
import { postcardFeedQueryOptions } from "@/lib/queries/postcard-feed.query";

type CreateCommentVariables = {
  postcardId: string;
  content: string;
};

export function useCreatePostcardComment() {
  const queryClient = useQueryClient();

  return useMutation<PostcardComment, Error, CreateCommentVariables>({
    mutationFn: ({ postcardId, content }) =>
      createPostcardComment(postcardId, { content }),
    onSuccess: async (_, { postcardId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: postcardCommentsQueryOptions(postcardId).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: postcardDetailQueryOptions(postcardId).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: postcardFeedQueryOptions().queryKey,
        }),
      ]);
    },
  });
}
