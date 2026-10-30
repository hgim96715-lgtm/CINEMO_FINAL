import { queryOptions } from "@tanstack/react-query";

import { getAdminUserActivity } from "@/lib/api/admin";

export const adminUserActivityQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["admin", "users", userId, "activity"],
    queryFn: () => getAdminUserActivity(userId),
    retry: false,
  });
