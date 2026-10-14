import { apiClient } from "./apiClient";
import {
  CreatePostcardCommentRequest,
  PostcardCommentResponse,
} from "@cinemo/api-contract";

export type PostcardComment = PostcardCommentResponse;

export type PostcardCommentPage = {
  items: PostcardComment[];
  nextCursor: string | null;
  hasNextPage: boolean;
};

export type GetPostcardCommentsParams = {
  cursor?: string;
  pageSize?: number;
};

export type CreatePostcardCommentInput = CreatePostcardCommentRequest;

export type UpdatePostcardCommentInput = {
  content: string;
};

export async function getPostcardComments(
  postcardId: string,
  params?: GetPostcardCommentsParams,
  signal?: AbortSignal,
): Promise<PostcardCommentPage> {
  const { data } = await apiClient.get<PostcardCommentPage>(
    `/postcards/${encodeURIComponent(postcardId)}/comments`,
    {
      params,
      signal,
    },
  );

  return data;
}

export async function createPostcardComment(
  postcardId: string,
  input: CreatePostcardCommentInput,
  signal?: AbortSignal,
): Promise<PostcardComment> {
  const { data } = await apiClient.post<PostcardComment>(
    `/postcards/${encodeURIComponent(postcardId)}/comments`,
    input,
    { signal },
  );

  return data;
}

export async function deletePostcardComment(
  postcardId: string,
  commentId: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiClient.delete(`/postcards/${postcardId}/comments/${commentId}`, {
    signal,
  });
}

export async function updatePostcardComment(
  postcardId: string,
  commentId: string,
  input: UpdatePostcardCommentInput,
  signal?: AbortSignal,
): Promise<PostcardComment> {
  const { data } = await apiClient.patch<PostcardComment>(
    `/postcards/${encodeURIComponent(postcardId)}/comments/${encodeURIComponent(commentId)}`,
    input,
    { signal },
  );

  return data;
}
