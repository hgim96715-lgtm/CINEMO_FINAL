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
import { MoviePersonService } from "../movie-person.service";

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
  movieCertifications: {
    orderBy: {
      verifiedAt: "desc",
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
      mediaType: {
        in: [MediaType.POSTER, MediaType.TRAILER],
      },
      status: MediaStatus.ACTIVE,
    },
    orderBy: [{ isPrimary: "desc" }, { verifiedAt: "desc" }],
  },
  movieGenres: {
    orderBy: {
      name: "asc",
    },
  },
  movieCertifications: {
    orderBy: {
      verifiedAt: "desc",
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
  runningTime: number | null;
  releaseDate: Date | null;
  genres: string[];
  productionCountryCodes: string[];
  certifications: string[];
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
  rankChange?: number | null;
  audienceCount?: number | null;
  totalAudienceCount?: number | null;
  collectedAt?: Date;
};

export type SaveMoviePopularitySnapshotInput = {
  movieId: string;
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

  async search(
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

    const [movies, totalCount] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          updatedAt: "desc",
        },
        include: movieSearchInclude,
      }),
      this.prisma.movie.count({ where }),
    ]);

    return {
      movies,
      totalCount,
    };
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
    matchedMovieId?: string,
  ): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      const ensureMovieTitle = async (movieId: string) => {
        const title = input.title.trim();

        if (!title) {
          return;
        }

        const existingTitle = await tx.movieTitle.findFirst({
          where: {
            movieId,
            title: {
              equals: title,
              mode: "insensitive",
            },
          },
        });

        if (existingTitle) {
          return;
        }

        const primaryTitle = await tx.movieTitle.findFirst({
          where: {
            movieId,
            titleType: TitleType.PRIMARY,
          },
          select: {
            id: true,
          },
        });

        await tx.movieTitle.create({
          data: {
            movieId,
            title,
            titleType: primaryTitle ? TitleType.ALIAS : TitleType.PRIMARY,
            languageCode: input.languageCode,
          },
        });
      };

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
        await ensureMovieTitle(existingLink.movieId);
        return existingLink.movieId;
      }

      if (matchedMovieId) {
        await tx.movieProviderLink.create({
          data: {
            movieId: matchedMovieId,
            sourceProvider: input.sourceProvider,
            externalId: input.externalId,
            matchMethod: MatchMethod.AUTO,
            matchStatus: MatchStatus.APPROVED,
            confidence: new Prisma.Decimal("1.0000"),
            verifiedAt: new Date(),
          },
        });

        await ensureMovieTitle(matchedMovieId);
        return matchedMovieId;
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

      if (input.runningTime !== null && input.runningTime > 0) {
        await tx.movie.update({
          where: { id: movie.id },
          data: { runtime: input.runningTime },
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

      const certifications = [
        ...new Set(
          input.certifications
            .map((certification) => certification.trim())
            .filter(Boolean),
        ),
      ];

      await tx.movieCertification.deleteMany({
        where: {
          movieId: movie.id,
          sourceProvider: SourceProvider.KOBIS,
        },
      });

      if (certifications.length > 0) {
        await tx.movieCertification.createMany({
          data: certifications.map((watchGradeName, index) => ({
            movieId: movie.id,
            auditNo: `${input.movieCd}:${index}`,
            watchGradeName,
            sourceProvider: SourceProvider.KOBIS,
            verifiedAt: new Date(),
          })),
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
          movieId: movie.id,
          creditType: credit.creditType,
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
    const latestSnapshot = await this.prisma.moviePopularitySnapshot.findFirst({
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

    const popularityWhere: Prisma.MoviePopularitySnapshotWhereInput = {
      collectedAt: latestSnapshot.collectedAt,
    };

    const [rankings, totalCount] = await this.prisma.$transaction([
      this.prisma.moviePopularitySnapshot.findMany({
        where: popularityWhere,
        orderBy: {
          rank: "asc",
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          movieId: true,
        },
      }),
      this.prisma.moviePopularitySnapshot.count({
        where: popularityWhere,
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

  async findUpcomingMovies(
    page: number,
    limit: number,
    filter: {
      startDate: Date;
      endDate?: Date;
    },
  ): Promise<{
    movies: MovieSearchWithDetails[];
    totalCount: number;
  }> {
    const releaseDate: Prisma.DateTimeFilter = {
      gte: filter.startDate,
      ...(filter.endDate ? { lt: filter.endDate } : {}),
    };

    const where: Prisma.MovieWhereInput = {
      AND: [
        {
          OR: [{ runtime: null }, { runtime: { gt: 30 } }],
        },
      ],
      releases: {
        some: {
          releaseDate,
          status: {
            in: [ReleaseStatus.ANNOUNCED, ReleaseStatus.SCHEDULED],
          },
        },
      },
    };

    const endDateCondition = filter.endDate
      ? Prisma.sql`AND release."releaseDate" < ${filter.endDate}`
      : Prisma.empty;

    // Prisma는 to-many relation에서 _count 정렬만 지원하고,
    // MIN / MAX 같은 날짜 집계 정렬은 지원하지 않음.
    //
    // 기존에는 createdAt 기준으로 먼저 10개를 자른 뒤 웹에서 정렬해서,
    // 개봉일이 빠른 영화가 로비에 표시되지 않는 문제가 발생함.
    //
    // LIMIT / OFFSET 적용 전에 가장 빠른 예정 개봉일 기준으로 정렬하기 위해
    // SQL로 영화 ID만 먼저 조회함.
    const movieIds = await this.prisma.$queryRaw<
      Array<{ id: string }>
    >(Prisma.sql`
      SELECT movie.id
      FROM movies AS movie
      WHERE (movie.runtime IS NULL OR movie.runtime > 30)
        AND EXISTS (
          SELECT 1
          FROM movie_releases AS release
          WHERE release."movieId" = movie.id
            AND release."releaseDate" >= ${filter.startDate}
            ${endDateCondition}
            AND release.status IN ('ANNOUNCED', 'SCHEDULED')
        )
      ORDER BY (
        SELECT MIN(release."releaseDate")
        FROM movie_releases AS release
        WHERE release."movieId" = movie.id
          AND release."releaseDate" >= ${filter.startDate}
          ${endDateCondition}
          AND release.status IN ('ANNOUNCED', 'SCHEDULED')
      ) ASC, movie.id ASC
      OFFSET ${(page - 1) * limit}
      LIMIT ${limit}
    `);

    const [movies, totalCount] = await Promise.all([
      this.prisma.movie.findMany({
        where: {
          id: {
            in: movieIds.map(({ id }) => id),
          },
        },
        include: movieSearchInclude,
      }),
      this.prisma.movie.count({ where }),
    ]);

    const moviesById = new Map(movies.map((movie) => [movie.id, movie]));
    const orderedMovies = movieIds.flatMap(({ id }) => {
      const movie = moviesById.get(id);
      return movie ? [movie] : [];
    });

    return {
      movies: orderedMovies,
      totalCount,
    };
  }

  async findReleasedMovies(
    page: number,
    limit: number,
    filter: {
      startDate: Date;
      endDate: Date;
    },
  ): Promise<{
    movies: MovieSearchWithDetails[];
    totalCount: number;
  }> {
    const releaseDate: Prisma.DateTimeFilter = {
      gte: filter.startDate,
      lt: filter.endDate,
    };
    const releasedReleaseWhere: Prisma.MovieReleaseWhereInput = {
      releaseDate,
      status: ReleaseStatus.RELEASED,
      OR: [
        { countryCode: "KR" },
        { countryCode: null, isPrimary: true },
      ],
    };

    const where: Prisma.MovieWhereInput = {
      AND: [
        { OR: [{ runtime: null }, { runtime: { gt: 30 } }] },
        {
          titles: {
            some: {
              titleType: TitleType.PRIMARY,
              languageCode: {
                startsWith: "ko",
              },
            },
          },
        },
      ],
      releases: {
        some: {
          ...releasedReleaseWhere,
        },
      },
    };

    // 개봉일이 빠른 순서가 아니라 최근 개봉작부터 보여주기 위해
    // 페이지를 자르기 전에 해당 기간의 가장 늦은 개봉일로 정렬함!!! 여기서 해야함!!
    const movieIds = await this.prisma.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT movie.id
        FROM movies AS movie
        WHERE (movie.runtime IS NULL OR movie.runtime > 30)
          AND EXISTS (
            SELECT 1
            FROM movie_titles AS title
            WHERE title."movieId" = movie.id
              AND title."titleType" = 'PRIMARY'
              AND title."languageCode" LIKE 'ko%'
          )
          AND EXISTS (
            SELECT 1
            FROM movie_releases AS release
            WHERE release."movieId" = movie.id
              AND release."releaseDate" >= ${filter.startDate}
              AND release."releaseDate" < ${filter.endDate}
              AND release.status = 'RELEASED'
              AND (
                release."countryCode" = 'KR'
                OR (
                  release."countryCode" IS NULL
                  AND release."isPrimary" = true
                )
              )
          )
        ORDER BY (
          SELECT MAX(release."releaseDate")
          FROM movie_releases AS release
          WHERE release."movieId" = movie.id
            AND release."releaseDate" >= ${filter.startDate}
            AND release."releaseDate" < ${filter.endDate}
            AND release.status = 'RELEASED'
            AND (
              release."countryCode" = 'KR'
              OR (
                release."countryCode" IS NULL
                AND release."isPrimary" = true
              )
            )
          ) DESC, movie.id ASC
        OFFSET ${(page - 1) * limit}
        LIMIT ${limit}
      `,
    );

    const [movies, totalCount] = await Promise.all([
      this.prisma.movie.findMany({
        where: {
          id: {
            in: movieIds.map(({ id }) => id),
          },
        },
        include: {
          ...movieSearchInclude,
          releases: {
            where: releasedReleaseWhere,
            orderBy: [{ isPrimary: "desc" }, { releaseDate: "desc" }],
            take: 1,
          },
        },
      }),
      this.prisma.movie.count({ where }),
    ]);

    const moviesById = new Map(movies.map((movie) => [movie.id, movie]));
    const orderedMovies = movieIds.flatMap(({ id }) => {
      const movie = moviesById.get(id);
      return movie ? [movie] : [];
    });

    return {
      movies: orderedMovies,
      totalCount,
    };
  }

  async findMovieRankings(
    page: number,
    limit: number,
  ): Promise<{
    movies: Array<{
      movie: MovieSearchWithDetails;
      rank: number;
      rankChange: number | null;
      audienceCount: number | null;
      totalAudienceCount: number | null;
    }>;
    totalCount: number;
  }> {
    const latestSnapshot = await this.prisma.movieRankingSnapshot.findFirst({
      where: {
        sourceProvider: SourceProvider.KOBIS,
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
      sourceProvider: SourceProvider.KOBIS,
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
          rank: true,
          rankChange: true,
          audienceCount: true,
          totalAudienceCount: true,
        },
      }),
      this.prisma.movieRankingSnapshot.count({
        where: rankingWhere,
      }),
    ]);

    const movies = await this.prisma.movie.findMany({
      where: {
        id: {
          in: rankings.map((ranking) => ranking.movieId),
        },
      },
      include: movieSearchInclude,
    });

    const moviesById = new Map(movies.map((movie) => [movie.id, movie]));

    return {
      movies: rankings.flatMap((ranking) => {
        const movie = moviesById.get(ranking.movieId);

        return movie
          ? [
              {
                movie,
                rank: ranking.rank,
                rankChange: ranking.rankChange,
                audienceCount: ranking.audienceCount,
                totalAudienceCount: ranking.totalAudienceCount,
              },
            ]
          : [];
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
        rankChange: input.rankChange ?? null,
        audienceCount: input.audienceCount ?? null,
        totalAudienceCount: input.totalAudienceCount ?? null,
        collectedAt: input.collectedAt ?? new Date(),
      },
    });
  }

  async saveMoviePopularitySnapshot(
    input: SaveMoviePopularitySnapshotInput,
  ): Promise<void> {
    await this.prisma.moviePopularitySnapshot.create({
      data: {
        movieId: input.movieId,
        rank: input.rank,
        collectedAt: input.collectedAt ?? new Date(),
      },
    });
  }
}
