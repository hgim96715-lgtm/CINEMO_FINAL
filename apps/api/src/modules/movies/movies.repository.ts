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

const movieSearchInclude = {
  titles: {
    orderBy: {
      createdAt: "asc",
    },
  },
  releases: {
    orderBy: [{ isPrimary: "desc" }, { releaseDate: "desc" }],
    take: 1,
  },
  media: {
    where: {
      mediaType: "POSTER",
      status: MediaStatus.ACTIVE,
    },
    orderBy: [{ isPrimary: "desc" }, { verifiedAt: "desc" }],
    take: 1,
  },
  movieGenres: {
    orderBy: {
      name: "asc",
    },
  },
} satisfies Prisma.MovieInclude;

export type MovieSearchWithDetails = Prisma.MovieGetPayload<{
  include: typeof movieSearchInclude;
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
  ): Promise<{
    movies: MovieSearchWithDetails[];
    totalCount: number;
  }> {
    const where: Prisma.MovieWhereInput = {
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
    };

    return this.prisma.$transaction(async (tx) => {
      const [movies, totalCount] = await Promise.all([
        tx.movie.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            updatedAt: "desc",
          },
          include: movieSearchInclude,
        }),
        tx.movie.count({ where }),
      ]);

      return {
        movies,
        totalCount,
      };
    });
  }
}
