import type { Postcard as PrismaPostcard, Prisma } from "@prisma/client";
import type { Postcard } from "@/modules/postcards/domain/postcard.types";
import type { PostcardResponseDto } from "../responses/postcard.response.dto";

const toJsonObject = (
  value: Prisma.JsonValue | null,
): Record<string, unknown> | null => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

export const toPostcardResponse = (
  record: PrismaPostcard | Postcard,
): PostcardResponseDto => ({
  id: record.id,
  movieId: record.movieId,
  movie: "movie" in record ? record.movie : null,
  media: "media" in record
    ? record.media.map((media) => ({
        id: media.id,
        type: media.type,
        url: media.url,
        storageKey: media.storageKey,
        altText: media.altText,
        sortOrder: media.sortOrder,
      }))
    : [],
  type: record.type,
  source: record.source,
  quoteSource: record.quoteSource,
  content: record.content,
  backgroundStyle: record.backgroundStyle,
  backgroundImageKey: record.backgroundImageKey,
  reactionCount: record.reactionCount,
  commentCount: record.commentCount,
  shareCount: record.shareCount,
  visibility: record.visibility,
  status: record.status,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});
