import { Injectable } from "@nestjs/common";
import { SourceProvider } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class MoviePersonEnrichmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPendingPeople(cursor: string | undefined, limit: number) {
    return this.prisma.moviePerson.findMany({
      where: {
        ...(cursor ? { id: { gt: cursor } } : {}),
        tmdbEnrichedAt: null,
        providerLinks: {
          some: {
            sourceProvider: SourceProvider.TMDB,
          },
        },
      },
      select: {
        id: true,
        name: true,
        providerLinks: {
          where: {
            sourceProvider: SourceProvider.TMDB,
          },
          select: {
            externalId: true,
          },
          take: 1,
        },
      },
      orderBy: {
        id: "asc",
      },
      take: limit,
    });
  }
}
