import { Injectable, Logger } from "@nestjs/common";
import { Prisma, UserActivityType } from "@prisma/client";

import { ActivityRepository } from "./activity.repository";

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly activityRepository: ActivityRepository) {}

  async record(input: {
    userId: string;
    type: UserActivityType;
    targetType?: string;
    targetId?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    try {
      await this.activityRepository.create(input);
    } catch (error) {
      this.logger.error(
        `활동 로그 저장 실패: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
