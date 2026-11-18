import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/prisma/prisma.service";
import { RegisterPushTokenRequestDto } from "@/modules/notifications/dto/requests/register-push-token.request.dto";

@Injectable()
export class PushTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  register(userId: string, dto: RegisterPushTokenRequestDto) {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const pushToken = await tx.pushToken.upsert({
        where: {
          token: dto.token,
        },
        create: {
          userId,
          token: dto.token,
          platform: dto.platform,
          lastUsedAt: now,
        },
        update: {
          userId,
          platform: dto.platform,
          lastUsedAt: now,
        },
        select: {
          id: true,
          token: true,
          platform: true,
          lastUsedAt: true,
        },
      });

      // 첫 푸시 토큰 등록은 오늘의 영화 알림을 기본 구독한다.
      // 이후 사용자가 해제한 상태는 토큰 갱신으로 다시 켜지지 않는다.
      await tx.dailyMoviePreference.upsert({
        where: { userId },
        create: {
          userId,
          pushTokenId: pushToken.id,
          enabled: true,
          enabledAt: now,
          lastVisitAt: now,
        },
        update: { pushTokenId: pushToken.id },
      });

      return pushToken;
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
