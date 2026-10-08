import { queryOptions } from "@tanstack/react-query";

import { getPerson } from "@/lib/api/people";

export const personDetailQueryOptions = (personId: string) =>
  queryOptions({
    queryKey: ["people", "detail", personId],
    queryFn: ({ signal }) => getPerson(personId, signal),
    enabled: personId.length > 0,
    staleTime: 5 * 60_000,
  });
