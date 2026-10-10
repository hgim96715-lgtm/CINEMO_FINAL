import { queryOptions } from "@tanstack/react-query";

import {
  getBookmarkedPeople,
  getPersonBookmark,
} from "@/lib/api/people";

export const personBookmarkQueryOptions = (personId: string) =>
  queryOptions({
    queryKey: ["people", "bookmark", personId],
    queryFn: ({ signal }) => getPersonBookmark(personId, signal),
    enabled: personId.length > 0,
    staleTime: 5 * 60_000,
  });

export const bookmarkedPeopleQueryOptions = () =>
  queryOptions({
    queryKey: ["people", "bookmarks"],
    queryFn: ({ signal }) => getBookmarkedPeople(signal),
    staleTime: 5 * 60_000,
  });
