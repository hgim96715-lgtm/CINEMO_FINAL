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
