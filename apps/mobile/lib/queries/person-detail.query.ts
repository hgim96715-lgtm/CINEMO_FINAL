import { queryOptions } from "@tanstack/react-query";

import { getPerson } from "@/lib/api/people";

export const personDetailQueryOptions = (personId: string) =>
  queryOptions({
    queryKey: ["people", "detail", personId] as const,
    queryFn: ({ signal }) => getPerson(personId, signal),
    enabled: personId.trim().length > 0,
    staleTime: 5 * 60_000,
  });
