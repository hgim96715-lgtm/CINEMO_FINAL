import {
  PostcardCommentStatus,
  PostcardReportStatus,
  PostcardStatus,
} from "@prisma/client";
import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/prisma/prisma.service";

const openStatuses = [
  PostcardReportStatus.PENDING,
  PostcardReportStatus.REVIEWING,
];

export type ResolvePostcardReportAction = "hide" | "dismiss";
export type ResolvePostcardReportResult =
  | "not-found"
  | "already-resolved"
  | "resolved";

@Injectable()
export class PostcardReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOpen() {
    return this.prisma.postcardReport.findMany({
      where: { status: { in: openStatuses } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 100,
      select: {
        id: true,
        reason: true,
        createdAt: true,
        reporter: { select: { nickname: true } },
        postcard: { select: { content: true, user: { select: { nickname: true } } } },
        comment: { select: { content: true, user: { select: { nickname: true } } } },
      },
    });
  }

  async resolve(
    id: string,
    moderatorId: string,
    action: ResolvePostcardReportAction,
  ): Promise<ResolvePostcardReportResult> {
    return this.prisma.$transaction(async (tx) => {
      const report = await tx.postcardReport.findUnique({ where: { id } });
      if (!report) return "not-found";

      const changed = await tx.postcardReport.updateMany({
        where: { id, status: { in: openStatuses } },
        data: {
          status:
            action === "hide"
              ? PostcardReportStatus.RESOLVED
              : PostcardReportStatus.REJECTED,
          resolvedAt: new Date(),
        },
      });
      if (!changed.count) return "already-resolved";
      if (action === "dismiss") return "resolved";

      if (report.commentId) {
        const hidden = await tx.postcardComment.updateMany({
          where: { id: report.commentId, status: PostcardCommentStatus.PUBLISHED },
          data: { status: PostcardCommentStatus.HIDDEN },
        });
        if (hidden.count) {
          await tx.postcard.updateMany({
            where: { id: report.postcardId, commentCount: { gt: 0 } },
            data: { commentCount: { decrement: 1 } },
          });
        }
      } else {
        const hidden = await tx.postcard.updateMany({
          where: { id: report.postcardId, status: PostcardStatus.PUBLISHED },
          data: { status: PostcardStatus.HIDDEN },
        });
        if (hidden.count) {
          await tx.postcardModeration.create({
            data: {
              postcardId: report.postcardId,
              moderatorId,
              action: "HIDE",
              reason: report.reason,
            },
          });
        }
      }

      return "resolved";
    });
  }
}
