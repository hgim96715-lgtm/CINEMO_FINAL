import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createPostcard,
  type CreatePostcardInput,
  createPostcardQuoteSuggestion,
  type CreatePostcardQuoteSuggestionInput,
  publishPostcard,
  updatePostcard,
} from "@/lib/api/postcards";
import {
  myPostcardsQueryOptions,
  postcardFeedQueryOptions,
} from "./postcard-feed.query";
import { UpdatePostcardRequest } from "@cinemo/api-contract";
import { postcardDetailQueryOptions } from "@/lib/queries/postcard-detail.query";

export function useCreatePostcard() {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: async (input: CreatePostcardInput) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        return await createPostcard(input, controller.signal);
      } finally {
        abortControllerRef.current = null;
      }
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: postcardFeedQueryOptions().queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: myPostcardsQueryOptions().queryKey,
        }),
      ]);
    },
  });

  return {
    ...mutation,
    cancel: () => {
      abortControllerRef.current?.abort();
    },
  };
}

export function usePublishPostcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postcardId: string) => publishPostcard(postcardId),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: postcardFeedQueryOptions().queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: myPostcardsQueryOptions().queryKey,
        }),
      ]);
    },
  });
}

export function useCreatePostcardQuoteSuggestion() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: async (input: CreatePostcardQuoteSuggestionInput) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        return await createPostcardQuoteSuggestion(input, controller.signal);
      } finally {
        abortControllerRef.current = null;
      }
    },
  });

  return {
    ...mutation,
    cancel: () => {
      abortControllerRef.current?.abort();
    },
  };
}

export function useUpdatePostcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postcardId,
      request,
    }: {
      postcardId: string;
      request: UpdatePostcardRequest;
    }) => updatePostcard(postcardId, request),

    onSuccess: async (postcard) => {
      queryClient.setQueryData(
        postcardDetailQueryOptions(postcard.id).queryKey,
        postcard,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: postcardFeedQueryOptions().queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: myPostcardsQueryOptions().queryKey,
        }),
      ]);
    },
  });
}
