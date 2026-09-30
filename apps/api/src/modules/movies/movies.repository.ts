import { Injectable } from "@nestjs/common";
import { MatchStatus, MediaStatus, Prisma } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

const movieInclude = {
  titles: {
    orderBy: {
      titleType: "asc",
    },
  },
  releases: {
    orderBy: [{ isPrimary: "desc" }, { releaseDate: "desc" }],
  },
  media: {
    where: {
      status: MediaStatus.ACTIVE,
    },
    orderBy: [{ isPrimary: "desc" }, { verifiedAt: "desc" }],
  },
  providerLinks: {
    where: {
      matchStatus: MatchStatus.APPROVED,
    },
  },
  watchOptions: {
    where: {
      regionCode: "KR",
    },
    orderBy: [{ watchProvider: "asc" }, { availabilityType: "asc" }],
  },
  movieGenres: {
    orderBy: {
      name: "asc",
    },
  },
  movieCredits: {
    orderBy: {
      displayOrder: "asc",
    },
    include: {
      person: true,
    },
  },
} satisfies Prisma.MovieInclude;

type MovieWithDetails = Prisma.MovieGetPayload<{
  include: typeof movieInclude;
}>;

@Injectable()
export class MoviesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(movieId: string): Prisma.PrismaPromise<MovieWithDetails | null> {
    return this.prisma.movie.findUnique({
      where: {
        id: movieId,
      },
      include: movieInclude,
    });
  }

  search(
    query: string,
    page: number,
    limit: number,
  ): Prisma.PrismaPromise<MovieWithDetails[]> {
    return this.prisma.movie.findMany({
      where: {
        OR: [
          {
            titles: {
              some: {
                title: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            movieGenres: {
              some: {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            movieCredits: {
              some: {
                person: {
                  OR: [
                    {
                      name: {
                        contains: query,
                        mode: "insensitive",
                      },
                    },
                    {
                      nameEn: {
                        contains: query,
                        mode: "insensitive",
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        updatedAt: "desc",
      },
      include: movieInclude,
    });
  }
}
