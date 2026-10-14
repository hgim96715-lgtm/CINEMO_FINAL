import {
  PostcardFeedResponse as ApiPostcardFeedResponse,
  PostcardMedia,
  PostcardMetadata,
  PostcardResponse,
  PostcardStyle,
  UpdatePostcardRequest,
} from "@cinemo/api-contract";

import { apiClient } from "./apiClient";

export type Postcard = PostcardResponse;
export type PostcardFeedResponse = ApiPostcardFeedResponse;

export type GetPostcardFeedParams = {
  cursor?: string;
  pageSize?: number;
};

export type CreatePostcardInput = {
  movieId: string;
  type: Postcard["type"];
  content: string;
  quoteSource?: Postcard["quoteSource"];
  metadata?: PostcardMetadata | null;
  style?: PostcardStyle | null;
  media?: PostcardMedia[];
  backgroundStyle?: string | null;
  backgroundImageKey?: string | null;
  visibility?: Postcard["visibility"];
};

export async function getPostcardFeed(
  params?: GetPostcardFeedParams,
  signal?: AbortSignal,
): Promise<PostcardFeedResponse> {
  const { data } = await apiClient.get<PostcardFeedResponse>(
    "/postcards/feed",
    {
      params,
      signal,
    },
  );

  return data;
}

export async function getMyPostcards(
  params?: GetPostcardFeedParams,
  signal?: AbortSignal,
): Promise<PostcardFeedResponse> {
  const { data } = await apiClient.get<PostcardFeedResponse>(
    "/postcards/mine",
    {
      params,
      signal,
    },
  );

  return data;
}

export async function getPostcard(
  postcardId: string,
  signal?: AbortSignal,
): Promise<Postcard> {
  const { data } = await apiClient.get<Postcard>(
    `/postcards/${encodeURIComponent(postcardId)}`,
    { signal },
  );

  return data;
}

export async function createPostcard(
  input: CreatePostcardInput,
  signal?: AbortSignal,
): Promise<Postcard> {
  const { data } = await apiClient.post<Postcard>("/postcards", input, {
    signal,
  });

  return data;
}

export async function publishPostcard(
  postcardId: string,
  signal?: AbortSignal,
): Promise<Postcard> {
  const { data } = await apiClient.patch<Postcard>(
    `/postcards/${encodeURIComponent(postcardId)}/publish`,
    undefined,
    { signal },
  );

  return data;
}
export type CreatePostcardQuoteSuggestionInput = {
  movieTitle: string;
  review?: string;
  language?: string;
};

export type PostcardQuoteSuggestionResponse = {
  found: boolean;
  original: string | null;
  translation: string | null;
  sourceLanguage: string | null;
  targetLanguage: "ko";
  isAiSuggested: true;
};

export async function createPostcardQuoteSuggestion(
  input: CreatePostcardQuoteSuggestionInput,
  signal?: AbortSignal,
): Promise<PostcardQuoteSuggestionResponse> {
  const { data } = await apiClient.post<PostcardQuoteSuggestionResponse>(
    "/postcards/ai/quote-suggestion",
    input,
    { signal },
  );

  return data;
}

export async function updatePostcard(
  postcardId: string,
  input: UpdatePostcardRequest,
  signal?: AbortSignal,
): Promise<Postcard> {
  const { data } = await apiClient.patch<Postcard>(
    `/postcards/${encodeURIComponent(postcardId)}`,
    input,
    { signal },
  );
  return data;
}
export type SharePostcardInput = {
  channel?: string | null;
};
export type SharePostcardResponse = {
  shared: boolean;
  shareCount: number;
};

export async function sharePostcard(
  postcardId: string,
  input: SharePostcardInput = {},
  signal?: AbortSignal,
): Promise<SharePostcardResponse> {
  const { data } = await apiClient.post<SharePostcardResponse>(
    `/postcards/${encodeURIComponent(postcardId)}/share`,
    input,
    { signal },
  );
  return data;
}
