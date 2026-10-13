import { Prisma } from "@prisma/client";
import type { Postcard as PrismaPostcard } from "@prisma/client";
import type {
  Postcard,
} from "../domain/postcard.types";

export const postcardWithMovieArgs = Prisma.validator<Prisma.PostcardDefaultArgs>()({
  include: {
    movie: {
      select: {
        id: true,
        titles: {
          where: {
            titleType: "PRIMARY",
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        media: {
          where: {
            mediaType: "POSTER",
            status: "ACTIVE",
          },
          orderBy: [{ isPrimary: "desc" }, { verifiedAt: "desc" }],
          take: 1,
        },
      },
    },
    media: {
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    },
  },
});

export type PostcardWithMovie = Prisma.PostcardGetPayload<
  typeof postcardWithMovieArgs
>;

type PostcardRecord = PrismaPostcard | PostcardWithMovie;

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

export const toPostcard = (record: PostcardRecord): Postcard => ({
  id: record.id,
  userId: record.userId,
  movieId: record.movieId,
  movie: "movie" in record
    ? {
        id: record.movie.id,
        title: record.movie.titles[0]?.title ?? "제목 없음",
        posterUrl: record.movie.media[0]?.url ?? null,
      }
    : null,
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
