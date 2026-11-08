import type {
  CreatePostcardCommentRequest,
  PostcardCommentResponse,
} from "@cinemo/api-contract";

import { apiClient } from "./apiClient";

export type PostcardComment = PostcardCommentResponse;

export type PostcardCommentPage = {
  items: PostcardComment[];
  nextCursor: string | null;
  hasNextPage: boolean;
};

export async function getPostcardComments(
  postcardId: string,
  params?: { cursor?: string; pageSize?: number },
  signal?: AbortSignal,
): Promise<PostcardCommentPage> {
  const response = await apiClient.get<PostcardCommentPage>(
    `/postcards/${encodeURIComponent(postcardId)}/comments`,
    { params, signal },
  );

  return response.data;
}

export async function createPostcardComment(
  postcardId: string,
  input: CreatePostcardCommentRequest,
  signal?: AbortSignal,
): Promise<PostcardComment> {
  const response = await apiClient.post<PostcardComment>(
    `/postcards/${encodeURIComponent(postcardId)}/comments`,
    input,
    { signal },
  );

  return response.data;
}

export async function deletePostcardComment(postcardId: string, commentId: string): Promise<void> {
  await apiClient.delete(`/postcards/${encodeURIComponent(postcardId)}/comments/${encodeURIComponent(commentId)}`);
}

export async function reportPostcardComment(
  postcardId: string,
  commentId: string,
  reason: string,
): Promise<void> {
  await apiClient.post(
    `/postcards/${encodeURIComponent(postcardId)}/comments/${encodeURIComponent(commentId)}/reports`,
    { reason },
  );
}

export async function updatePostcardComment(
  postcardId: string,
  commentId: string,
  content: string,
): Promise<PostcardComment> {
  const { data } = await apiClient.patch<PostcardComment>(
    `/postcards/${encodeURIComponent(postcardId)}/comments/${encodeURIComponent(commentId)}`,
    { content },
  );
  return data;
}
