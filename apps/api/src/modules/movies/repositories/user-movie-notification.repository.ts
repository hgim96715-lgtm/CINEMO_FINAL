import { Injectable } from "@nestjs/common";
import { MovieNotificationType, ReleaseStatus } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

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
}
