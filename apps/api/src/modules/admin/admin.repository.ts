import { Injectable } from "@nestjs/common";
import { UserStatus } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUsers() {
    const now = new Date();
    const recentLoginSince = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [users, totalUsers, activeUsers, recentLogins, activeSessions] =
      await Promise.all([
        this.prisma.user.findMany({
          orderBy: [{ lastLoginAt: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            email: true,
            nickname: true,
            status: true,
            isAdmin: true,
            lastLoginAt: true,
            createdAt: true,
            sessions: {
              where: {
                revokedAt: null,
                expiresAt: { gt: now },
              },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                createdAt: true,
                expiresAt: true,
                ipAddress: true,
                userAgent: true,
              },
            },
            _count: {
              select: {
                sessions: {
                  where: {
                    revokedAt: null,
                    expiresAt: { gt: now },
                  },
                },
              },
            },
          },
        }),
        this.prisma.user.count(),
        this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
        this.prisma.user.count({
          where: { lastLoginAt: { gte: recentLoginSince } },
        }),
        this.prisma.authSession.count({
          where: {
            revokedAt: null,
            expiresAt: { gt: now },
          },
        }),
      ]);

    return {
      summary: {
        totalUsers,
        activeUsers,
        recentLogins,
        activeSessions,
      },
      items: users.map((user) => ({
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        status: user.status,
        isAdmin: user.isAdmin,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        activeSessionCount: user._count.sessions,
        latestSession: user.sessions[0] ?? null,
      })),
    };
  }

  async findUserActivity(userId: string) {
    return this.prisma.userActivityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        type: true,
        targetType: true,
        targetId: true,
        metadata: true,
        createdAt: true,
      },
    });
  }
}
