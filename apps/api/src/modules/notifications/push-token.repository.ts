import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/prisma/prisma.service";
import { RegisterPushTokenRequestDto } from "@/modules/notifications/dto/requests/register-push-token.request.dto";

@Injectable()
export class PushTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  register(userId: string, dto: RegisterPushTokenRequestDto) {
    return this.prisma.pushToken.upsert({
      where: {
        token: dto.token,
      },
      create: {
        userId,
        token: dto.token,
        platform: dto.platform,
        lastUsedAt: new Date(),
      },
      update: {
        userId,
        platform: dto.platform,
        lastUsedAt: new Date(),
      },
      select: {
        id: true,
        token: true,
        platform: true,
        lastUsedAt: true,
      },
    });
  }
  findTokensByUserId(userId: string) {
    return this.prisma.pushToken.findMany({
      where: {
        userId,
      },
      select: {
        token: true,
      },
    });
  }
}
