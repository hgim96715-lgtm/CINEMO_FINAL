import { queryOptions } from "@tanstack/react-query";

import { getAdminUsers } from "@/lib/api/admin";

export const adminUsersQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "users"],
    queryFn: getAdminUsers,
    retry: false,
  });
