import type { Postcard as PrismaPostcard, Prisma } from "@prisma/client";
import type { Postcard } from "../domain/postcard.types";

const toJsonObject = (
  value: Prisma.JsonValue | null,
): Record<string, unknown> | null => {
  if (value === null) {
    return null;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("엽서 JSON 값은 객체여야 합니다.");
  }

  return value as Record<string, unknown>;
};

export const toPostcard = (record: PrismaPostcard): Postcard => ({
  id: record.id,
  userId: record.userId,
  movieId: record.movieId,
  type: record.type,
  source: record.source,
  content: record.content,
  visibility: record.visibility,
  status: record.status,
  backgroundStyle: record.backgroundStyle,
  backgroundImageKey: record.backgroundImageKey,
  style: toJsonObject(record.style),
  metadata: toJsonObject(record.metadata),
  reactionCount: record.reactionCount,
  commentCount: record.commentCount,
  shareCount: record.shareCount,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
