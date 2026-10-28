import { Injectable } from "@nestjs/common";
import { MovieNotificationType, ReleaseStatus } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

const getSeoulDateKey = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
};

const addDays = (dateKey: string, days: number) => {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const toUtcDate = (dateKey: string) =>
  new Date(`${dateKey}T00:00:00.000Z`);

@Injectable()
export class UserMovieNotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMovie(movieId: string) {
    return this.prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true },
    });
  }

  findUpcomingRelease(movieId: string) {
    return this.prisma.movieRelease.findFirst({
      where: {
        movieId,
        status: {
          in: [ReleaseStatus.ANNOUNCED, ReleaseStatus.SCHEDULED],
        },
        releaseDate: {
          gt: new Date(),
        },
        OR: [{ countryCode: "KR" }, { countryCode: null, isPrimary: true }],
      },
      orderBy: [{ isPrimary: "desc" }, { releaseDate: "asc" }],
    });
  }

  findByUserAndMovie(userId: string, movieId: string) {
    return this.prisma.userMovieNotification.findUnique({
      where: {
        userId_movieId_notificationType: {
          userId,
          movieId,
          notificationType: MovieNotificationType.RELEASE,
        },
      },
      include: {
        release: true,
      },
    });
  }

  async enable(userId: string, movieId: string, releaseId: string | null) {
    return this.prisma.userMovieNotification.upsert({
      where: {
        userId_movieId_notificationType: {
          userId,
          movieId,
          notificationType: MovieNotificationType.RELEASE,
        },
      },
      create: {
        userId,
        movieId,
        releaseId,
        notificationType: MovieNotificationType.RELEASE,
        enabled: true,
      },
      update: {
        releaseId,
        enabled: true,
        notifiedAt: null,
      },
    });
  }

  async disable(userId: string, movieId: string) {
    return this.prisma.userMovieNotification.update({
      where: {
        userId_movieId_notificationType: {
          userId,
          movieId,
          notificationType: MovieNotificationType.RELEASE,
        },
      },
      data: {
        enabled: false,
      },
    });
  }

  findDueReleaseNotifications(now = new Date()) {
    const today = getSeoulDateKey(now);
    const tomorrow = addDays(today, 1);
    const dayAfterTomorrow = addDays(today, 2);
    const releaseStatuses = [
      ReleaseStatus.ANNOUNCED,
      ReleaseStatus.SCHEDULED,
      ReleaseStatus.RELEASED,
    ];

    return this.prisma.userMovieNotification.findMany({
      where: {
        notificationType: MovieNotificationType.RELEASE,
        enabled: true,
        OR: [
          {
            dayBeforeNotifiedAt: null,
            release: {
              is: {
                releaseDate: {
                  gte: toUtcDate(tomorrow),
                  lt: toUtcDate(dayAfterTomorrow),
                },
                status: {
                  in: releaseStatuses,
                },
              },
            },
          },
          {
            notifiedAt: null,
            release: {
              is: {
                releaseDate: {
                  gte: toUtcDate(today),
                  lt: toUtcDate(tomorrow),
                },
                status: {
                  in: releaseStatuses,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        dayBeforeNotifiedAt: true,
        notifiedAt: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
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
              take: 1,
              select: {
                title: true,
              },
            },
          },
        },
        release: {
          select: {
            releaseDate: true,
          },
        },
      },
    });
  }
  async marksNotified(
    notificationId: string,
    timing: "day-before" | "day-of",
  ) {
    return this.prisma.userMovieNotification.update({
      where: {
        id: notificationId,
      },
      data: {
        ...(timing === "day-before"
          ? { dayBeforeNotifiedAt: new Date() }
          : { notifiedAt: new Date() }),
      },
    });
  }

  findEnabledReleasNotifications(userId: string) {
    return this.prisma.userMovieNotification.findMany({
      where: {
        userId,
        notificationType: MovieNotificationType.RELEASE,
        enabled: true,
      },
      orderBy: {
        release: {
          releaseDate: "asc",
        },
      },
      select: {
        id: true,
        movieId: true,
        release: {
          select: {
            releaseDate: true,
          },
        },
        movie: {
          select: {
            titles: {
              where: {
                titleType: "PRIMARY",
              },
              orderBy: {
                createdAt: "asc",
              },
              take: 1,
              select: {
                title: true,
              },
            },
            media: {
              where: {
                mediaType: "POSTER",
                isPrimary: true,
                status: "ACTIVE",
              },
              take: 1,
              select: {
                url: true,
              },
            },
          },
        },
      },
    });
  }
}
