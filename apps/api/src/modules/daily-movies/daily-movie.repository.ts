import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";
import type { DailyMovieRecord } from "./mappers/daily-movie.mapper";

const eligibleMovieWhere: Prisma.MovieWhereInput = {
  visibility: "PUBLIC",
  releases: { some: { status: "RELEASED" } },
  media: { some: { mediaType: "POSTER", status: "ACTIVE" } },
  movieCertifications: {
    none: {
      OR: [
        { watchGradeName: { contains: "청소년" } },
        { watchGradeName: { contains: "19세" } },
      ],
    },
  },
};

const dailyMovieSelect = {
  id: true,
  titles: {
    orderBy: [{ titleType: "asc" }, { createdAt: "asc" }],
    select: { title: true, languageCode: true },
  },
  media: {
    where: { mediaType: "POSTER", status: "ACTIVE" },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    select: { url: true },
    take: 1,
  },
  movieGenres: { select: { name: true } },
} satisfies Prisma.MovieSelect;

type DuePreferencesInput = {
  day: string;
  start: Date;
  now: Date;
};

@Injectable()
export class DailyMovieRepository {
  constructor(private readonly prisma: PrismaService) {}

  private eligiblePreferencesWhere({ day, start, now }: DuePreferencesInput): Prisma.DailyMoviePreferenceWhereInput {
    return {
      lastVisitAt: { lt: start },
      user: {
        status: "ACTIVE",
        mobileRefreshTokens: { some: { expiresAt: { gt: now }, revokedAt: null } },
        dailyMovieDeliveries: { none: { day } },
      },
    };
  }

  async findPopularCatalog(
    ids: string[],
    userId?: string,
  ): Promise<DailyMovieRecord[]> {
    if (!ids.length) return [];
    return this.prisma.movie.findMany({
      where: {
        ...eligibleMovieWhere,
        id: { in: ids },
        ...(userId && { userMovieRecords: { none: { userId, isWatched: true } } }),
      },
      select: dailyMovieSelect,
    }) as unknown as Promise<DailyMovieRecord[]>;
  }

  findPublicFallback(userId?: string): Promise<DailyMovieRecord | null> {
    return this.prisma.movie.findFirst({
      where: {
        ...eligibleMovieWhere,
        titles: { some: {} },
        ...(userId && { userMovieRecords: { none: { userId, isWatched: true } } }),
      },
      orderBy: [{ tmdbVoteCount: { sort: "desc", nulls: "last" } }, { id: "asc" }],
      select: dailyMovieSelect,
    }) as unknown as Promise<DailyMovieRecord | null>;
  }

  findSavedUnwatched(userId: string): Promise<{ movie: DailyMovieRecord }[]> {
    return this.prisma.userMovieRecord.findMany({
      where: { userId, isFavorite: true, isWatched: false, movie: eligibleMovieWhere },
      orderBy: [{ updatedAt: "desc" }, { movieId: "asc" }],
      select: { movie: { select: dailyMovieSelect } },
      take: 5,
    }) as unknown as Promise<{ movie: DailyMovieRecord }[]>;
  }

  findWatchedGenres(userId: string) {
    return this.prisma.userMovieRecord.findMany({
      where: { userId, isWatched: true },
      orderBy: { watchedAt: { sort: "desc", nulls: "last" } },
      select: { movie: { select: { movieGenres: { select: { name: true } } } } },
      take: 20,
    });
  }

  findTasteAlternatives(
    userId: string,
    genre: string | undefined,
    excludedId?: string,
  ): Promise<DailyMovieRecord[]> {
    return this.prisma.movie.findMany({
      where: {
        ...eligibleMovieWhere,
        titles: { some: {} },
        ...(genre && { movieGenres: { some: { name: genre } } }),
        ...(excludedId && { id: { not: excludedId } }),
        userMovieRecords: { none: { userId, isWatched: true } },
      },
      orderBy: [{ tmdbVoteCount: { sort: "desc", nulls: "last" } }, { id: "asc" }],
      select: dailyMovieSelect,
      take: 20,
    }) as unknown as Promise<DailyMovieRecord[]>;
  }

  findTasteFallback(
    userId: string,
    excludedIds: string[],
  ): Promise<DailyMovieRecord | null> {
    return this.prisma.movie.findFirst({
      where: {
        ...eligibleMovieWhere,
        titles: { some: {} },
        id: { notIn: excludedIds },
        userMovieRecords: { none: { userId, isWatched: true } },
      },
      orderBy: [{ tmdbVoteCount: { sort: "desc", nulls: "last" } }, { id: "asc" }],
      select: dailyMovieSelect,
    }) as unknown as Promise<DailyMovieRecord | null>;
  }

  findPreparedPick(
    day: string,
    userId?: string,
  ): Promise<{ copy: string; movie: DailyMovieRecord } | null> {
    return this.prisma.dailyMoviePick.findFirst({
      where: {
        day,
        movie: {
          ...eligibleMovieWhere,
          ...(userId && { userMovieRecords: { none: { userId, isWatched: true } } }),
        },
      },
      select: { copy: true, movie: { select: dailyMovieSelect } },
    }) as unknown as Promise<{ copy: string; movie: DailyMovieRecord } | null>;
  }

  findPick(day: string) {
    return this.prisma.dailyMoviePick.findUnique({ where: { day }, select: { day: true } });
  }

  findRecentPickMovieIds() {
    return this.prisma.dailyMoviePick.findMany({
      orderBy: { day: "desc" },
      take: 7,
      select: { movieId: true },
    });
  }

  findHiddenGemCandidates(
    genres: string[],
    excludedMovieIds: string[],
  ): Promise<(DailyMovieRecord & { overview: string | null })[]> {
    return this.prisma.movie.findMany({
      where: {
        ...eligibleMovieWhere,
        id: { notIn: excludedMovieIds },
        overview: { not: null },
        tmdbVoteCount: { gte: 50, lte: 2500 },
        tmdbVoteAverage: { gte: 7 },
        movieGenres: { some: { name: { in: genres } } },
      },
      orderBy: [{ tmdbVoteAverage: "desc" }, { tmdbVoteCount: "desc" }, { id: "asc" }],
      select: { ...dailyMovieSelect, overview: true },
      take: 16,
    }) as unknown as Promise<(DailyMovieRecord & { overview: string | null })[]>;
  }

  createPick(day: string, movieId: string, copy: string) {
    return this.prisma.dailyMoviePick.createMany({
      data: { day, movieId, copy },
      skipDuplicates: true,
    });
  }

  findWeatherRegion(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { dailyMovieWeatherNx: true, dailyMovieWeatherNy: true },
    });
  }

  updateWeatherRegion(userId: string, nx: number | null, ny: number | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { dailyMovieWeatherNx: nx, dailyMovieWeatherNy: ny },
    });
  }

  findPushSettings() {
    return this.prisma.dailyMoviePushSettings.findUnique({
      where: { id: 1 },
      select: { enabled: true, weekdays: true, hour: true, title: true, body: true },
    });
  }

  savePushSettings(data: { enabled: boolean; weekdays: number[]; hour: number; title: string; body: string }) {
    return this.prisma.dailyMoviePushSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
  }

  findPreference(userId: string) {
    return this.prisma.dailyMoviePreference.findUnique({
      where: { userId },
      select: { pushToken: { select: { userId: true } } },
    });
  }

  deletePreference(userId: string) {
    return this.prisma.dailyMoviePreference.deleteMany({ where: { userId } });
  }

  findPushToken(userId: string, pushTokenId: string) {
    return this.prisma.pushToken.findFirst({
      where: { id: pushTokenId, userId },
      select: { id: true },
    });
  }

  savePreference(userId: string, pushTokenId: string, now: Date) {
    return this.prisma.dailyMoviePreference.upsert({
      where: { userId },
      create: { userId, pushTokenId, enabledAt: now, lastVisitAt: now },
      update: { pushTokenId, enabledAt: now, lastVisitAt: now },
    });
  }

  recordVisit(userId: string, today: Date, now: Date) {
    return this.prisma.dailyMoviePreference.updateMany({
      where: { userId, lastVisitAt: { lt: today } },
      data: { lastVisitAt: now },
    });
  }

  findDueUserIds(input: DuePreferencesInput, cursor?: string) {
    return this.prisma.dailyMoviePreference.findMany({
      where: {
        ...this.eligiblePreferencesWhere(input),
        ...(cursor && { userId: { gt: cursor } }),
      },
      orderBy: { userId: "asc" },
      select: { userId: true },
      take: 100,
    });
  }

  claimDeliveryToken(userId: string, input: DuePreferencesInput) {
    return this.prisma.$transaction(async (tx) => {
      const preference = await tx.dailyMoviePreference.findFirst({
        where: {
          ...this.eligiblePreferencesWhere(input),
          userId,
          pushToken: { userId },
        },
        select: { pushToken: { select: { token: true } } },
      });
      if (!preference) return null;

      const claimed = await tx.dailyMovieDelivery.createMany({
        data: { userId, day: input.day },
        skipDuplicates: true,
      });
      return claimed.count ? preference.pushToken.token : null;
    });
  }
}
