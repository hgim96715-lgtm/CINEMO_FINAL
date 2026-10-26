import { queryOptions } from "@tanstack/react-query";

import { getBookmarkedPeople, getPersonBookmark } from "@/lib/api/people";

export const personBookmarkQueryOptions = (
  personId: string,
  enabled = true,
) =>
  queryOptions({
    queryKey: ["people", "bookmark", personId] as const,
    queryFn: ({ signal }) => getPersonBookmark(personId, signal),
    enabled: enabled && personId.trim().length > 0,
    staleTime: 5 * 60_000,
  });

export const bookmarkedPeopleQueryOptions = () =>
  queryOptions({
    queryKey: ["people", "bookmarks"] as const,
    queryFn: ({ signal }) => getBookmarkedPeople(signal),
    staleTime: 5 * 60_000,
  });
