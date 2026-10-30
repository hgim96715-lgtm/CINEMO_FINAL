import { apiClient } from "./apiClient";

export type AdminUserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export type AdminUser = {
  id: string;
  email: string | null;
  nickname: string;
  status: AdminUserStatus;
  isAdmin: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  activeSessionCount: number;
  latestSession: {
    createdAt: string;
    expiresAt: string;
    ipAddress: string | null;
    userAgent: string | null;
  } | null;
};

export type AdminUsersResponse = {
  summary: {
    totalUsers: number;
    activeUsers: number;
    recentLogins: number;
    activeSessions: number;
  };
  items: AdminUser[];
};

export type AdminUserActivity = {
  id: string;
  type: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export async function getAdminUsers(): Promise<AdminUsersResponse> {
  const { data } = await apiClient.get<AdminUsersResponse>("/admin/users");
  return data;
}

export async function getAdminUserActivity(
  userId: string,
): Promise<AdminUserActivity[]> {
  const { data } = await apiClient.get<AdminUserActivity[]>(
    `/admin/users/${encodeURIComponent(userId)}/activity`,
  );
  return data;
}
