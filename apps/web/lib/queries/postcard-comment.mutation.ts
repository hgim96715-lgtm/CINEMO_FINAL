import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createPostcardComment,
  type CreatePostcardCommentInput,
  deletePostcardComment,
  updatePostcardComment,
  type UpdatePostcardCommentInput,
} from "@/lib/api/postcard-comments";
import { postcardCommentsQueryOptions } from "@/lib/queries/postcard-comment.query";
import { postcardDetailQueryOptions } from "@/lib/queries/postcard-detail.query";
import { postcardFeedQueryOptions } from "@/lib/queries/postcard-feed.query";

type CreatePostcardCommentMutationInput = {
  postcardId: string;
  input: CreatePostcardCommentInput;
};

export function useCreatePostcardComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postcardId, input }: CreatePostcardCommentMutationInput) =>
      createPostcardComment(postcardId, input),

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

type DeletePostcardCommentInput = {
  postcardId: string;
  commentId: string;
};

export function useDeletePostcardComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postcardId, commentId }: DeletePostcardCommentInput) =>
      deletePostcardComment(postcardId, commentId),

    onSuccess: async (_, { postcardId }) => {
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: postcardCommentsQueryOptions(postcardId).queryKey,
          type: "active",
        }),
        queryClient.invalidateQueries({
          queryKey: ["postcards", postcardId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["postcards"],
        }),
      ]);
    },
    onError: async (_, { postcardId }) => {
      await queryClient.refetchQueries({
        queryKey: postcardCommentsQueryOptions(postcardId).queryKey,
        type: "active",
      });
    },
  });
}

type UpdatePostcardCommentInputWithIds = {
  postcardId: string;
  commentId: string;
  input: UpdatePostcardCommentInput;
};

export function useUpdatePostcardComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postcardId,
      commentId,
      input,
    }: UpdatePostcardCommentInputWithIds) =>
      updatePostcardComment(postcardId, commentId, input),

    onSuccess: async (_, { postcardId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: postcardCommentsQueryOptions(postcardId).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: postcardDetailQueryOptions(postcardId).queryKey,
        }),
      ]);
    },
  });
}
