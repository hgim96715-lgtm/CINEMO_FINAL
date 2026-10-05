import type { UserStatus } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string | null;
  nickname: string;
  status: UserStatus;
  profileImageUrl: string | null;
};
