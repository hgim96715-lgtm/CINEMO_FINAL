import {
  Postcard,
  PostcardComment,
  PostcardCommentStatus,
  PostcardMediaType,
  PostcardNotificationType,
  PostcardQuoteSource,
  PostcardReport,
  PostcardReportStatus,
  PostcardSource,
  PostcardStatus,
  PostcardType,
  PostcardVisibility,
  Prisma,
} from "@prisma/client";
import type { Postcard as DomainPostcard } from "../domain/postcard.types";
import { PrismaService } from "@/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import {
  postcardWithMovieArgs,
  toPostcard,
} from "../mappers/postcard.mapper";

export type CreatePostcardMediaRepositoryInput = {
  type: PostcardMediaType;
  url?: string | null;
  storageKey?: string | null;
  altText?: string | null;
  sortOrder?: number;
};

export interface CreatePostcardRepositoryInput {
  userId: string;
  movieId: string;
  type: PostcardType;
  source: PostcardSource;
  quoteSource?: PostcardQuoteSource | null;
  content: string;
  metadata?: unknown | null;
  style?: unknown | null;
  media?: CreatePostcardMediaRepositoryInput[];
  backgroundStyle?: string | null;
  backgroundImageKey?: string | null;
  visibility?: PostcardVisibility;
}

export type CreatePostcardCommentRepositoryInput = {
  postcardId: string;
  userId: string;
  content: string;
  parentId?: string | null;
};

export type UpdatePostcardRepositoryInput = {
  postcardId: string;
  userId: string;
  quoteSource?: PostcardQuoteSource | null;
  content?: string;
  metadata?: unknown | null;
  style?: unknown | null;
  media?: CreatePostcardMediaRepositoryInput[];
  backgroundStyle?: string | null;
  backgroundImageKey?: string | null;
  visibility?: PostcardVisibility;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
};

export type CreateReactionRepositoryInput = {
  postcardId: string;
  userId: string;
  emoji: string;
};

export type CreateReportRepositoryInput = {
  postcardId: string;
  reporterId: string;
  reason: string;
};

export type CreateShareRepositoryInput = {
  postcardId: string;
  userId?: string | null;
  channel?: string | null;
};

const toPrismaJson = (value: unknown): Prisma.InputJsonValue =>
  value as Prisma.InputJsonValue;

export const PostcardNotificationArgs =
  Prisma.validator<Prisma.PostcardNotificationDefaultArgs>()({
    include: {
      actor: {
        select: {
          id: true,
          nickname: true,
          profileImageUrl: true,
        },
      },
    },
  });

export type PostcardNotificationWithActor =
  Prisma.PostcardNotificationGetPayload<typeof PostcardNotificationArgs>;

@Injectable()
export class PostcardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicFeed(
    cursor: string | undefined,
    pageSize: number,
  ): Promise<CursorPage<DomainPostcard>> {
    const items = await this.prisma.postcard.findMany({
      include: postcardWithMovieArgs.include,
      where: {
        visibility: PostcardVisibility.PUBLIC,
        status: PostcardStatus.PUBLISHED,
      },
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      take: pageSize + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });
    const hasNextPage = items.length > pageSize;
    const resultItems = hasNextPage ? items.slice(0, pageSize) : items;
    const nextCursor = hasNextPage
      ? (resultItems[resultItems.length - 1]?.id ?? null)
      : null;
    return {
      items: resultItems.map(toPostcard),
      nextCursor,
      hasNextPage,
    };
  }

  async findById(id: string, userId?: string): Promise<DomainPostcard | null> {
    const record = await this.prisma.postcard.findFirst({
      include: postcardWithMovieArgs.include,
      where: {
        id,
        status: {
          not: PostcardStatus.DELETED,
        },
        OR: [
          ...(userId ? [{ userId }] : []),
          {
            visibility: PostcardVisibility.PUBLIC,
            status: PostcardStatus.PUBLISHED,
          },
        ],
      },
    });
    return record ? toPostcard(record) : null;
  }

  async create(
    input: CreatePostcardRepositoryInput,
  ): Promise<DomainPostcard> {
    const record = await this.prisma.postcard.create({
      data: {
        userId: input.userId,
        movieId: input.movieId,
        type: input.type,
        source: input.source,
        quoteSource: input.quoteSource ?? null,
        content: input.content,
        metadata:
          input.metadata === undefined
            ? undefined
            : input.metadata === null
              ? Prisma.JsonNull
              : toPrismaJson(input.metadata),
        style:
          input.style === undefined
            ? undefined
            : input.style === null
              ? Prisma.JsonNull
              : toPrismaJson(input.style),
        backgroundStyle: input.backgroundStyle ?? null,
        backgroundImageKey: input.backgroundImageKey ?? null,
        visibility: input.visibility ?? PostcardVisibility.PRIVATE,
        media: input.media?.length
          ? {
              create: input.media.map((media) => ({
                type: media.type,
                url: media.url ?? null,
                storageKey: media.storageKey ?? null,
                altText: media.altText ?? null,
                sortOrder: media.sortOrder ?? 0,
              })),
            }
          : undefined,
      },
    });

    return toPostcard(record);
  }

  async update(
    input: UpdatePostcardRepositoryInput,
  ): Promise<DomainPostcard | null> {
    return this.prisma.$transaction(async (tx) => {
      const postcard = await tx.postcard.findFirst({
        where: {
          id: input.postcardId,
          userId: input.userId,
          status: {
            not: PostcardStatus.DELETED,
          },
        },
      });

      if (!postcard) {
        return null;
      }

      const latestRevision = await tx.postcardRevision.findFirst({
        where: {
          postcardId: postcard.id,
        },
        orderBy: {
          version: "desc",
        },
        select: {
          version: true,
        },
      });

      const nextVersion = (latestRevision?.version ?? 0) + 1;

      const updatedPostcard = await tx.postcard.update({
        where: {
          id: postcard.id,
        },
        data: {
          ...(input.quoteSource !== undefined && {
            quoteSource: input.quoteSource,
          }),

          ...(input.content !== undefined && {
            content: input.content,
          }),

          ...(input.metadata !== undefined && {
            metadata:
              input.metadata === null
                ? Prisma.JsonNull
                : toPrismaJson(input.metadata),
          }),

          ...(input.style !== undefined && {
            style:
              input.style === null
                ? Prisma.JsonNull
                : toPrismaJson(input.style),
          }),

          ...(input.backgroundStyle !== undefined && {
            backgroundStyle: input.backgroundStyle,
          }),

          ...(input.backgroundImageKey !== undefined && {
            backgroundImageKey: input.backgroundImageKey,
          }),

          ...(input.visibility !== undefined && {
            visibility: input.visibility,
          }),

          editedAt: new Date(),
        },
      });

      if (input.media !== undefined) {
        await tx.postcardMedia.deleteMany({
          where: {
            postcardId: postcard.id,
          },
        });

        if (input.media.length > 0) {
          await tx.postcardMedia.createMany({
            data: input.media.map((media) => ({
              postcardId: postcard.id,
              type: media.type,
              url: media.url ?? null,
              storageKey: media.storageKey ?? null,
              altText: media.altText ?? null,
              sortOrder: media.sortOrder ?? 0,
            })),
          });
        }
      }

      await tx.postcardRevision.create({
        data: {
          postcardId: postcard.id,
          version: nextVersion,
          content: updatedPostcard.content,
          source: PostcardSource.USER,
          editorId: input.userId,
        },
      });

      return toPostcard(updatedPostcard);
    });
  }

  async publish(
    postcardId: string,
    userId: string,
  ): Promise<DomainPostcard | null> {
    return this.prisma.$transaction(async (tx) => {
      const postcard = await tx.postcard.findFirst({
        where: {
          id: postcardId,
          userId,
          status: {
            not: PostcardStatus.DELETED,
          },
        },
      });

      if (!postcard) {
        return null;
      }

      const updatedPostcard = await tx.postcard.update({
        where: {
          id: postcard.id,
        },
        data: {
          status: PostcardStatus.PUBLISHED,
          publishedAt: postcard.publishedAt ?? new Date(),
          deletedAt: null,
        },
      });

      return toPostcard(updatedPostcard);
    });
  }
  async findMine(
    userId: string,
    cursor: string | undefined,
    pageSize: number,
  ): Promise<CursorPage<DomainPostcard>> {
    const items = await this.prisma.postcard.findMany({
      include: postcardWithMovieArgs.include,
      where: {
        userId,
        status: {
          not: PostcardStatus.DELETED,
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      take: pageSize + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });
    const hasNextPage = items.length > pageSize;
    const resultItems = hasNextPage ? items.slice(0, pageSize) : items;
    const nextCursor = hasNextPage
      ? (resultItems[resultItems.length - 1]?.id ?? null)
      : null;
    return {
      items: resultItems.map(toPostcard),
      nextCursor,
      hasNextPage,
    };
  }

  async softDelete(postcardId: string, userId: string): Promise<boolean> {
    const result = await this.prisma.postcard.updateMany({
      where: {
        id: postcardId,
        userId,
        status: {
          not: PostcardStatus.DELETED,
        },
      },
      data: {
        status: PostcardStatus.DELETED,
        deletedAt: new Date(),
      },
    });

    return result.count > 0;
  }

  async createComment(
    input: CreatePostcardCommentRepositoryInput,
  ): Promise<PostcardComment | null> {
    return this.prisma.$transaction(async (tx) => {
      const postcard = await tx.postcard.findFirst({
        where: {
          id: input.postcardId,
          visibility: PostcardVisibility.PUBLIC,
          status: PostcardStatus.PUBLISHED,
        },
        select: { id: true, userId: true },
      });

      if (!postcard) {
        return null;
      }

      let parentComment: { id: string; userId: string } | null = null;
      if (input.parentId) {
        parentComment = await tx.postcardComment.findFirst({
          where: {
            id: input.parentId,
            postcardId: input.postcardId,
            status: PostcardCommentStatus.PUBLISHED,
          },
          select: { id: true, userId: true },
        });

        if (!parentComment) {
          return null;
        }
      }

      const comment = await tx.postcardComment.create({
        data: {
          postcardId: input.postcardId,
          userId: input.userId,
          content: input.content,
          parentId: input.parentId ?? null,
          status: PostcardCommentStatus.PUBLISHED,
        },
      });

      await tx.postcard.update({
        where: { id: input.postcardId },
        data: { commentCount: { increment: 1 } },
      });

      if (parentComment) {
        await tx.postcardComment.update({
          where: { id: parentComment.id },
          data: { replyCount: { increment: 1 } },
        });
      }

      const recipientId = parentComment?.userId ?? postcard.userId;
      if (recipientId !== input.userId) {
        await tx.postcardNotification.create({
          data: {
            recipientId,
            actorId: input.userId,
            postcardId: input.postcardId,
            commentId: comment.id,
            type: parentComment
              ? PostcardNotificationType.REPLY
              : PostcardNotificationType.COMMENT,
          },
        });
      }

      return comment;
    });
  }

  async createReaction(input: CreateReactionRepositoryInput): Promise<{
    emoji: string;
    reacted: boolean;
    reactionCount: number;
  } | null> {
    return this.prisma.$transaction(async (tx) => {
      const postcard = await tx.postcard.findFirst({
        where: {
          id: input.postcardId,
          visibility: PostcardVisibility.PUBLIC,
          status: PostcardStatus.PUBLISHED,
        },
        select: { id: true, userId: true, reactionCount: true },
      });

      if (!postcard) {
        return null;
      }

      const existing = await tx.postcardReaction.findUnique({
        where: {
          postcardId_userId_emoji: {
            postcardId: input.postcardId,
            userId: input.userId,
            emoji: input.emoji,
          },
        },
      });

      if (existing) {
        return {
          emoji: input.emoji,
          reacted: true,
          reactionCount: postcard.reactionCount,
        };
      }

      await tx.postcardReaction.create({
        data: {
          postcardId: input.postcardId,
          userId: input.userId,
          emoji: input.emoji,
        },
      });

      const updatedPostcard = await tx.postcard.update({
        where: { id: input.postcardId },
        data: { reactionCount: { increment: 1 } },
        select: { reactionCount: true },
      });

      if (postcard.userId !== input.userId) {
        await tx.postcardNotification.create({
          data: {
            recipientId: postcard.userId,
            actorId: input.userId,
            postcardId: input.postcardId,
            type: PostcardNotificationType.REACTION,
            reactionEmoji: input.emoji,
          },
        });
      }

      return {
        emoji: input.emoji,
        reacted: true,
        reactionCount: updatedPostcard.reactionCount,
      };
    });
  }

  async removeReaction(
    postcardId: string,
    userId: string,
    emoji: string,
  ): Promise<{
    emoji: string;
    reacted: boolean;
    reactionCount: number;
  } | null> {
    return this.prisma.$transaction(async (tx) => {
      const postcard = await tx.postcard.findFirst({
        where: { id: postcardId, status: { not: PostcardStatus.DELETED } },
        select: { id: true, reactionCount: true },
      });

      if (!postcard) {
        return null;
      }

      const result = await tx.postcardReaction.deleteMany({
        where: { postcardId, userId, emoji },
      });

      if (result.count === 0) {
        return { emoji, reacted: false, reactionCount: postcard.reactionCount };
      }

      const updatedPostcard = await tx.postcard.update({
        where: { id: postcardId },
        data: { reactionCount: { decrement: 1 } },
        select: { reactionCount: true },
      });

      return {
        emoji,
        reacted: false,
        reactionCount: Math.max(updatedPostcard.reactionCount, 0),
      };
    });
  }

  async addBookmark(postcardId: string, userId: string): Promise<boolean> {
    const postcard = await this.prisma.postcard.findFirst({
      where: {
        id: postcardId,
        visibility: PostcardVisibility.PUBLIC,
        status: PostcardStatus.PUBLISHED,
      },
      select: { id: true },
    });

    if (!postcard) {
      return false;
    }

    await this.prisma.postcardBookmark.upsert({
      where: { postcardId_userId: { postcardId, userId } },
      create: { postcardId, userId },
      update: {},
    });

    return true;
  }

  async removeBookmark(postcardId: string, userId: string): Promise<boolean> {
    const result = await this.prisma.postcardBookmark.deleteMany({
      where: { postcardId, userId },
    });

    return result.count > 0;
  }

  async createReport(
    input: CreateReportRepositoryInput,
  ): Promise<PostcardReport | null> {
    return this.prisma.$transaction(async (tx) => {
      const postcard = await tx.postcard.findFirst({
        where: {
          id: input.postcardId,
          visibility: PostcardVisibility.PUBLIC,
          status: PostcardStatus.PUBLISHED,
        },
        select: { id: true },
      });

      if (!postcard) {
        return null;
      }

      const existing = await tx.postcardReport.findFirst({
        where: {
          postcardId: input.postcardId,
          reporterId: input.reporterId,
          status: {
            in: [PostcardReportStatus.PENDING, PostcardReportStatus.REVIEWING],
          },
        },
      });

      if (existing) {
        return existing;
      }

      return tx.postcardReport.create({
        data: {
          postcardId: input.postcardId,
          reporterId: input.reporterId,
          reason: input.reason,
        },
      });
    });
  }

  async createShare(
    input: CreateShareRepositoryInput,
  ): Promise<{ shared: boolean; shareCount: number } | null> {
    return this.prisma.$transaction(async (tx) => {
      const postcard = await tx.postcard.findFirst({
        where: {
          id: input.postcardId,
          visibility: PostcardVisibility.PUBLIC,
          status: PostcardStatus.PUBLISHED,
        },
        select: { id: true },
      });

      if (!postcard) {
        return null;
      }

      await tx.postcardShare.create({
        data: {
          postcardId: input.postcardId,
          userId: input.userId ?? null,
          channel: input.channel ?? null,
        },
      });

      const updatedPostcard = await tx.postcard.update({
        where: { id: input.postcardId },
        data: { shareCount: { increment: 1 } },
        select: { shareCount: true },
      });

      return {
        shared: true,
        shareCount: updatedPostcard.shareCount,
      };
    });
  }

  async findNotifications(
    userId: string,
    cursor: string | undefined,
    pageSize: number,
    unreadOnly: boolean,
  ): Promise<CursorPage<PostcardNotificationWithActor>> {
    const notifications = await this.prisma.postcardNotification.findMany({
      where: {
        recipientId: userId,
        ...(unreadOnly && { readAt: null }),
      },
      include: {
        actor: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: pageSize + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasNextPage = notifications.length > pageSize;
    const items = hasNextPage
      ? notifications.slice(0, pageSize)
      : notifications;

    return {
      items,
      nextCursor: hasNextPage ? (items[items.length - 1]?.id ?? null) : null,
      hasNextPage,
    };
  }

  async markNotificationAsRead(
    notificationId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.prisma.postcardNotification.updateMany({
      where: {
        id: notificationId,
        recipientId: userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return result.count > 0;
  }

  async findComments(
    postcardId: string,
    cursor: string | undefined,
    pageSize: number,
  ): Promise<CursorPage<PostcardComment>> {
    const comments = await this.prisma.postcardComment.findMany({
      where: {
        postcardId,
        status: PostcardCommentStatus.PUBLISHED,
        postcard: {
          visibility: PostcardVisibility.PUBLIC,
          status: PostcardStatus.PUBLISHED,
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: pageSize + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasNextPage = comments.length > pageSize;
    const items = hasNextPage ? comments.slice(0, pageSize) : comments;

    const nextCursor = hasNextPage
      ? (items[items.length - 1]?.id ?? null)
      : null;

    return {
      items,
      nextCursor,
      hasNextPage,
    };
  }
}
