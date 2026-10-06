import { queryOptions } from "@tanstack/react-query";

import { getMe } from "@/lib/api/auth";

export const authMeQueryOptions = () =>
  queryOptions({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    retry: false,
  });
