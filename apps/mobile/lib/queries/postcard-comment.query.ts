import { infiniteQueryOptions } from "@tanstack/react-query";

import { getPostcardComments } from "@/lib/api/postcard-comments";

const POSTCARD_COMMENT_PAGE_SIZE = 20;

export const postcardCommentsQueryOptions = (postcardId: string) =>
  infiniteQueryOptions({
    queryKey: ["postcards", "comments", postcardId] as const,
    enabled: postcardId.length > 0,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      getPostcardComments(
        postcardId,
        { cursor: pageParam, pageSize: POSTCARD_COMMENT_PAGE_SIZE },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? (lastPage.nextCursor ?? undefined) : undefined,
  });
