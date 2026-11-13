import { Injectable } from "@nestjs/common";
import { Prisma, UserActivityType } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

export type CreateActivityInput = {
  userId: string;
  type: UserActivityType;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateActivityInput) {
    return this.prisma.userActivityLog.create({
      data: {
        userId: input.userId,
        type: input.type,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: input.metadata,
      },
    });
  }
}
