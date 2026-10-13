import { queryOptions } from "@tanstack/react-query";

import { getPostcard } from "@/lib/api/postcards";

export const postcardDetailQueryOptions = (postcardId: string) =>
  queryOptions({
    queryKey: ["postcards", "detail", postcardId],

    queryFn: ({ signal }) => getPostcard(postcardId, signal),

    enabled: postcardId.length > 0,
  });
