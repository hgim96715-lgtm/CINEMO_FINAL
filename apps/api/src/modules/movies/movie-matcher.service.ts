import { Injectable } from "@nestjs/common";
import { Prisma, TitleType } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class MovieMatcherService {
  constructor(private readonly prisma: PrismaService) {}
  findCandidates(title: string, releaseDate: Date | null) {
    const releaseCondition: Prisma.MovieWhereInput = releaseDate
      ? {
          releases: {
            some: {
              releaseDate,
            },
          },
        }
      : {};

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
