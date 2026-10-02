import { Injectable } from "@nestjs/common";
import {
  CreditType,
  MatchMethod,
  MatchStatus,
  MediaStatus,
  MediaType,
  Prisma,
  ReleaseStatus,
  ReleaseType,
  SourceProvider,
  TitleType,
} from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";
import { MoviePersonService } from "./movie-person.service";

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

type MovieSitemapItem = {
  id: string;
  updatedAt: Date;
};

export type CreateMovieFromProviderInput = {
  sourceProvider: SourceProvider;
  externalId: string;
  title: string;
  languageCode: string;
  releaseDate: Date | null;
  countryCode?: string | null;
  posterUrl?: string | null;
  posterExternalId?: string | null;
};

export type KobisMovieImportInput = {
  movieCd: string;
  title: string;
  releaseDate: Date | null;
  genres: string[];
  productionCountryCodes: string[];
  directors: Array<{
    name: string;
    nameEn: string | null;
  }>;
  actors: Array<{
    name: string;
    nameEn: string | null;
  }>;
};

export type SaveMovieRankingSnapshotInput = {
  movieId: string;
  sourceProvider: SourceProvider;
  rank: number;
  collectedAt?: Date;
};

@Injectable()
export class MoviesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moviePersonService: MoviePersonService,
  ) {}

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

  // Web SEO용 sitemap 생성을 위해 영화 ID와 수정 시각만 조회
  findSitemapMovies(): Prisma.PrismaPromise<MovieSitemapItem[]> {
    return this.prisma.movie.findMany({
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  async getOrCreateMovieByProviderLink(
    input: CreateMovieFromProviderInput,
  ): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      const existingLink = await tx.movieProviderLink.findUnique({
        where: {
          sourceProvider_externalId: {
            sourceProvider: input.sourceProvider,
            externalId: input.externalId,
          },
        },
        select: {
          movieId: true,
        },
      });

      if (existingLink) {
        return existingLink.movieId;
      }

      const movie = await tx.movie.create({
        data: {},
      });

      const release = await tx.movieRelease.create({
        data: {
          movieId: movie.id,
          releaseDate: input.releaseDate,
          releaseType: ReleaseType.INITIAL,
          status: input.releaseDate
            ? input.releaseDate.getTime() > Date.now()
              ? ReleaseStatus.SCHEDULED
              : ReleaseStatus.RELEASED
            : ReleaseStatus.ANNOUNCED,
          countryCode: input.countryCode ?? null,
          isPrimary: true,
        },
      });

      await tx.movieTitle.create({
        data: {
          movieId: movie.id,
          releaseId: release.id,
          title: input.title,
          titleType: TitleType.PRIMARY,
          languageCode: input.languageCode,
        },
      });

      if (input.posterUrl) {
        await tx.movieMedia.create({
          data: {
            movieId: movie.id,
            releaseId: release.id,
            mediaType: MediaType.POSTER,
            sourceProvider: input.sourceProvider,
            externalId: input.posterExternalId ?? null,
            url: input.posterUrl,
            isPrimary: true,
            status: MediaStatus.ACTIVE,
          },
        });
      }

      await tx.movieProviderLink.create({
        data: {
          movieId: movie.id,
          sourceProvider: input.sourceProvider,
          externalId: input.externalId,
          matchMethod: MatchMethod.AUTO,
          matchStatus: MatchStatus.APPROVED,
          confidence: new Prisma.Decimal("1.0000"),
          verifiedAt: new Date(),
        },
      });

      return movie.id;
    });
  }

  async findMovieIdByProviderLink(
    sourceProvider: SourceProvider,
    externalId: string,
  ): Promise<string | null> {
    const providerLink = await this.prisma.movieProviderLink.findUnique({
      where: {
        sourceProvider_externalId: {
          sourceProvider,
          externalId,
        },
      },
      select: {
        movieId: true,
      },
    });

    return providerLink?.movieId ?? null;
  }

  async createMovieRoot(): Promise<string> {
    const movie = await this.prisma.movie.create({
      data: {},
      select: {
        id: true,
      },
    });

    return movie.id;
  }

  async saveKobisMovie(
    movieId: string,
    input: KobisMovieImportInput,
  ): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      const movie = await tx.movie.findUniqueOrThrow({
        where: { id: movieId },
      });
      if (input.productionCountryCodes.length > 0) {
        const productionCountryCodes = [
          ...new Set([
            ...movie.productionCountryCodes,
            ...input.productionCountryCodes,
          ]),
        ];
        await tx.movie.update({
          where: { id: movie.id },
          data: {
            productionCountryCodes,
          },
        });
      }
      const releaseStatus = input.releaseDate
        ? input.releaseDate.getTime() > Date.now()
          ? ReleaseStatus.SCHEDULED
          : ReleaseStatus.RELEASED
        : ReleaseStatus.ANNOUNCED;

      const release =
        (await tx.movieRelease.findFirst({
          where: {
            movieId: movie.id,
            releaseType: ReleaseType.INITIAL,
          },
        })) ??
        (await tx.movieRelease.create({
          data: {
            movieId: movie.id,
            releaseDate: input.releaseDate,
            releaseType: ReleaseType.INITIAL,
            status: releaseStatus,
            isPrimary: true,
          },
        }));

      await tx.movieRelease.updateMany({
        where: {
          movieId: movie.id,
          id: { not: release.id },
        },
        data: {
          isPrimary: false,
        },
      });

      await tx.movieRelease.update({
        where: { id: release.id },
        data: {
          releaseDate: input.releaseDate,
          status: releaseStatus,
          isPrimary: true,
        },
      });

      await tx.movieProviderLink.upsert({
        where: {
          sourceProvider_externalId: {
            sourceProvider: SourceProvider.KOBIS,
            externalId: input.movieCd,
          },
        },
        create: {
          movieId: movie.id,
          sourceProvider: SourceProvider.KOBIS,
          externalId: input.movieCd,
          matchMethod: MatchMethod.AUTO,
          matchStatus: MatchStatus.APPROVED,
          confidence: new Prisma.Decimal("1.0000"),
          verifiedAt: new Date(),
        },
        update: {
          movieId: movie.id,
          matchStatus: MatchStatus.APPROVED,
          confidence: new Prisma.Decimal("1.0000"),
          verifiedAt: new Date(),
        },
      });

      const primaryTitle = await tx.movieTitle.findFirst({
        where: {
          movieId: movie.id,
          titleType: TitleType.PRIMARY,
        },
      });

      if (primaryTitle) {
        await tx.movieTitle.update({
          where: { id: primaryTitle.id },
          data: {
            title: input.title,
            releaseId: release.id,
            languageCode: "ko",
          },
        });
      } else {
        await tx.movieTitle.create({
          data: {
            movieId: movie.id,
            releaseId: release.id,
            title: input.title,
            titleType: TitleType.PRIMARY,
            languageCode: "ko",
          },
        });
      }

      for (const [index, genreName] of input.genres.entries()) {
        await tx.movieGenre.upsert({
          where: {
            movieId_name: {
              movieId: movie.id,
              name: genreName,
            },
          },
          create: {
            movieId: movie.id,
            name: genreName,
            code: `KOBIS_${index + 1}`,
          },
          update: {
            code: `KOBIS_${index + 1}`,
          },
        });
      }

      const credits = [
        ...input.directors.map((person) => ({
          ...person,
          creditType: CreditType.DIRECTOR,
        })),
        ...input.actors.map((person) => ({
          ...person,
          creditType: CreditType.ACTOR,
        })),
      ];

      for (const [index, credit] of credits.entries()) {
        const person = await this.moviePersonService.resolve(tx, {
          name: credit.name,
          nameEn: credit.nameEn,
        });

        await tx.movieCredit.upsert({
          where: {
            movieId_personId_creditType: {
              movieId: movie.id,
              personId: person.id,
              creditType: credit.creditType,
            },
          },
          create: {
            movieId: movie.id,
            personId: person.id,
            creditType: credit.creditType,
            displayOrder: index,
          },
          update: {
            displayOrder: index,
          },
        });
      }

      return movie.id;
    });
  }

  async findPopularMovies(
    page: number,
    limit: number,
  ): Promise<{
    movies: MovieSearchWithDetails[];
    totalCount: number;
  }> {
    const latestSnapshot = await this.prisma.movieRankingSnapshot.findFirst({
      where: {
        sourceProvider: SourceProvider.TMDB,
      },
      orderBy: {
        collectedAt: "desc",
      },
      select: {
        collectedAt: true,
      },
    });

    if (!latestSnapshot) {
      return {
        movies: [],
        totalCount: 0,
      };
    }

    const rankingWhere: Prisma.MovieRankingSnapshotWhereInput = {
      sourceProvider: SourceProvider.TMDB,
      collectedAt: latestSnapshot.collectedAt,
    };

    const [rankings, totalCount] = await this.prisma.$transaction([
      this.prisma.movieRankingSnapshot.findMany({
        where: rankingWhere,
        orderBy: {
          rank: "asc",
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          movieId: true,
        },
      }),
      this.prisma.movieRankingSnapshot.count({
        where: rankingWhere,
      }),
    ]);

    const movieIds = rankings.map((ranking) => ranking.movieId);

    const movies = await this.prisma.movie.findMany({
      where: {
        id: {
          in: movieIds,
        },
      },
      include: movieSearchInclude,
    });

    const moviesById = new Map(movies.map((movie) => [movie.id, movie]));

    return {
      movies: movieIds.flatMap((movieId) => {
        const movie = moviesById.get(movieId);
        return movie ? [movie] : [];
      }),
      totalCount,
    };
  }

  async saveMovieRankingSnapshot(
    input: SaveMovieRankingSnapshotInput,
  ): Promise<void> {
    await this.prisma.movieRankingSnapshot.create({
      data: {
        movieId: input.movieId,
        sourceProvider: input.sourceProvider,
        rank: input.rank,
        collectedAt: input.collectedAt ?? new Date(),
      },
    });
  }
}
