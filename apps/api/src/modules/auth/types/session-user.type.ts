import type { UserStatus, UserVisibility } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string | null;
  nickname: string;
  status: UserStatus;
  profileVisibility: UserVisibility;
  isAdmin: boolean;
  profileImageUrl: string | null;
};
