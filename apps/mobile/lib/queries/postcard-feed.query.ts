import { infiniteQueryOptions } from "@tanstack/react-query";

import { getMyPostcards, getPostcardFeed } from "@/lib/api/postcards";

const POSTCARD_PAGE_SIZE = 20;

export const postcardFeedQueryOptions = () =>
  infiniteQueryOptions({
    queryKey: ["postcards", "feed"] as const,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      getPostcardFeed(
        {
          cursor: pageParam,
          pageSize: POSTCARD_PAGE_SIZE,
        },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? (lastPage.nextCursor ?? undefined) : undefined,
  });

export const myPostcardsQueryOptions = () =>
  infiniteQueryOptions({
    queryKey: ["postcards", "mine"] as const,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      getMyPostcards(
        {
          cursor: pageParam,
          pageSize: POSTCARD_PAGE_SIZE,
        },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? (lastPage.nextCursor ?? undefined) : undefined,
  });
