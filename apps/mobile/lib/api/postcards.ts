import type {
  CreatePostcardRequest,
  PostcardFeedResponse as ApiPostcardFeedResponse,
  PostcardMedia,
  PostcardMetadata,
  PostcardResponse,
  PostcardStyle,
  UpdatePostcardRequest,
} from "@cinemo/api-contract";

import { apiClient } from "./apiClient";

export type { PostcardMetadata } from "@cinemo/api-contract";

export type Postcard = Omit<PostcardResponse, "metadata" | "style"> & {
  metadata: PostcardMetadata | null;
  style: PostcardStyle | null;
};

export type PostcardFeedResponse = Omit<
  ApiPostcardFeedResponse,
  "items"
> & {
  items: Postcard[];
};

export async function createPostcard(
  input: CreatePostcardRequest,
  signal?: AbortSignal,
): Promise<Postcard> {
  const response = await apiClient.post<Postcard>("/postcards", input, {
    signal,
  });

  return response.data;
}

export async function updatePostcard(
  postcardId: string,
  input: UpdatePostcardRequest,
  signal?: AbortSignal,
): Promise<Postcard> {
  const response = await apiClient.patch<Postcard>(
    `/postcards/${encodeURIComponent(postcardId)}`,
    input,
    { signal },
  );

  return response.data;
}

export async function deletePostcard(
  postcardId: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiClient.delete(`/postcards/${encodeURIComponent(postcardId)}`, {
    signal,
  });
}

export async function publishPostcard(
  postcardId: string,
  signal?: AbortSignal,
): Promise<Postcard> {
  const response = await apiClient.patch<Postcard>(
    `/postcards/${encodeURIComponent(postcardId)}/publish`,
    undefined,
    { signal },
  );

  return response.data;
}

export type CreatePostcardQuoteSuggestionInput = {
  movieId?: string;
  movieTitle: string;
  review?: string;
  language?: string;
};

export type CreatePostcardQuoteSuggestionResponse = {
  found: boolean;
  original: string | null;
  translation: string | null;
  sourceLanguage: string | null;
  targetLanguage: "ko";
  isAiSuggested: true;
  quoteSource: "USER" | "OPENSUBTITLES";
};

export async function createPostcardQuoteSuggestion(
  input: CreatePostcardQuoteSuggestionInput,
  signal?: AbortSignal,
): Promise<CreatePostcardQuoteSuggestionResponse> {
  const response = await apiClient.post<CreatePostcardQuoteSuggestionResponse>(
    "/postcards/ai/quote-suggestion",
    input,
    {
      signal,
      // 자막 검색과 AI 응답을 합친 요청이라 기본 10초보다 오래 걸릴 수 있음.
      timeout: 60_000,
    },
  );

  return response.data;
}

export type GetPostcardFeedParams = {
  cursor?: string;
  pageSize?: number;
};

export async function getMyPostcards(
  params?: GetPostcardFeedParams,
  signal?: AbortSignal,
): Promise<PostcardFeedResponse> {
  const response = await apiClient.get<PostcardFeedResponse>("/postcards/mine", {
    params,
    signal,
  });

  return response.data;
}

export async function getPostcardFeed(
  params?: GetPostcardFeedParams,
  signal?: AbortSignal,
): Promise<PostcardFeedResponse> {
  const response = await apiClient.get<PostcardFeedResponse>(
    "/postcards/feed",
    {
      params,
      signal,
    },
  );

  return response.data;
}

export async function getPostcard(
  postcardId: string,
  signal?: AbortSignal,
): Promise<Postcard> {
  const response = await apiClient.get<Postcard>(
    `/postcards/${encodeURIComponent(postcardId)}`,
    { signal },
  );

  return response.data;
}

export type PostcardReactionResponse = {
  emoji: string;
  reacted: boolean;
  reactionCount: number;
};

export async function setPostcardHeart(
  postcardId: string,
  isReacted: boolean,
  signal?: AbortSignal,
): Promise<PostcardReactionResponse> {
  const encodedPostcardId = encodeURIComponent(postcardId);
  const encodedEmoji = encodeURIComponent("❤️");

  if (isReacted) {
    const response = await apiClient.delete<PostcardReactionResponse>(
      `/postcards/${encodedPostcardId}/reactions/${encodedEmoji}`,
      { signal },
    );

    return response.data;
  }

  const response = await apiClient.post<PostcardReactionResponse>(
    `/postcards/${encodedPostcardId}/reactions`,
    { emoji: "❤️" },
    { signal },
  );

  return response.data;
}

export type SharePostcardResponse = {
  shared: boolean;
  shareCount: number;
};

export async function sharePostcard(
  postcardId: string,
  channel: string,
  signal?: AbortSignal,
): Promise<SharePostcardResponse> {
  const response = await apiClient.post<SharePostcardResponse>(
    `/postcards/${encodeURIComponent(postcardId)}/share`,
    { channel },
    { signal },
  );

  return response.data;
}
