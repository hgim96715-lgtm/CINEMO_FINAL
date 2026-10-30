import { Injectable, Logger } from "@nestjs/common";
import { Prisma, UserActivityType } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    userId: string;
    type: UserActivityType;
    targetType?: string;
    targetId?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    try {
      await this.prisma.userActivityLog.create({
        data: {
          userId: input.userId,
          type: input.type,
          targetType: input.targetType,
          targetId: input.targetId,
          metadata: input.metadata,
        },
      });
    } catch (error) {
      this.logger.error(
        `활동 로그 저장 실패: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
