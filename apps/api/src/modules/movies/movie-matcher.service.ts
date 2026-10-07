import { Injectable } from "@nestjs/common";
import { Prisma, TitleType } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

const RELEASE_DATE_MATCH_WINDOW_DAYS = 365;

@Injectable()
export class MovieMatcherService {
  constructor(private readonly prisma: PrismaService) {}
  findCandidates(title: string, releaseDate: Date | null) {
    const releaseCondition: Prisma.MovieWhereInput = {};

    if (releaseDate) {
      const releaseDateFrom = new Date(releaseDate);
      releaseDateFrom.setUTCDate(
        releaseDateFrom.getUTCDate() - RELEASE_DATE_MATCH_WINDOW_DAYS,
      );

      const releaseDateTo = new Date(releaseDate);
      releaseDateTo.setUTCDate(
        releaseDateTo.getUTCDate() + RELEASE_DATE_MATCH_WINDOW_DAYS,
      );

      releaseCondition.releases = {
        some: {
          releaseDate: {
            gte: releaseDateFrom,
            lte: releaseDateTo,
          },
        },
      };
    }

    return this.prisma.movie.findMany({
      where: {
        titles: {
          some: {
            titleType: TitleType.PRIMARY,
            title: {
              equals: title,
              mode: "insensitive",
            },
          },
        },
        ...releaseCondition,
      },
      select: {
        id: true,
        titles: {
          where: {
            titleType: TitleType.PRIMARY,
          },
          select: {
            title: true,
          },
        },
        releases: {
          select: {
            releaseDate: true,
            releaseType: true,
          },
        },
        providerLinks: {
          select: {
            sourceProvider: true,
            externalId: true,
          },
        },
      },
      take: 2,
    });
  }
}
