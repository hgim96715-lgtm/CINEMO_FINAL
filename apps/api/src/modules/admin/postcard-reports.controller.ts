import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, UseGuards } from "@nestjs/common";
import { IsIn } from "class-validator";
import { PostcardCommentStatus, PostcardReportStatus, PostcardStatus } from "@prisma/client";

import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import type { SessionUser } from "@/modules/auth/types/session-user.type";
import { PrismaService } from "@/prisma/prisma.service";
import { AdminGuard } from "./admin.guard";

class ResolvePostcardReportDto {
  @IsIn(["hide", "dismiss"])
  action!: "hide" | "dismiss";
}

const openStatuses = [PostcardReportStatus.PENDING, PostcardReportStatus.REVIEWING];

@Controller("admin/postcard-reports")
@UseGuards(AdminGuard)
export class PostcardReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
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

  @Patch(":id")
  async resolve(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: ResolvePostcardReportDto,
    @CurrentUser() moderator: SessionUser,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const report = await tx.postcardReport.findUnique({ where: { id } });
      if (!report) throw new NotFoundException("신고를 찾을 수 없습니다.");

      const changed = await tx.postcardReport.updateMany({
        where: { id, status: { in: openStatuses } },
        data: {
          status: input.action === "hide" ? PostcardReportStatus.RESOLVED : PostcardReportStatus.REJECTED,
          resolvedAt: new Date(),
        },
      });
      if (!changed.count || input.action === "dismiss") return;

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
            data: { postcardId: report.postcardId, moderatorId: moderator.id, action: "HIDE", reason: report.reason },
          });
        }
      }


    });
    return { resolved: true };
  }
}
