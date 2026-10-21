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

const kmdbMovieLookupArgs = Prisma.validator<Prisma.MovieDefaultArgs>()({
  select: {
    titles: {
      where: {
        titleType: TitleType.PRIMARY,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 1,
      select: {
        title: true,
      },
    },
    releases: {
      where: {
        countryCode: "KR",
      },
      orderBy: [{ isPrimary: "desc" }, { releaseDate: "asc" }],
      take: 1,
      select: {
        releaseDate: true,
      },
    },
  },
});

export type KmdbMovieCreditInput = {
  name: string;
  nameEn: string | null;
  externalId: string | null;
  creditType: CreditType;
};

export type SaveKmdbEnrichmentInput = {
  docId: string;
  title: string | null;
  runtime: number | null;
  overview: string | null;
  releaseDates: Date[];
  posterUrl: string | null;
  posterUrls: string[];
  genres: string[];
  credits: KmdbMovieCreditInput[];
};

@Injectable()
export class KmdbMovieEnrichmentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moviePersonService: MoviePersonService,
  ) {}

  findMovieForEnrichment(movieId: string) {
    return this.prisma.movie.findUnique({
      where: { id: movieId },
      ...kmdbMovieLookupArgs,
    });
  }

  findMovieTitle(movieId: string) {
    return this.prisma.movieTitle.findFirst({
      where: { movieId },
      orderBy: { createdAt: "asc" },
    });
  }

  saveEnrichment(movieId: string, input: SaveKmdbEnrichmentInput) {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.movie.findUniqueOrThrow({
          where: { id: movieId },
        });

        await tx.movieProviderLink.upsert({
          where: {
            sourceProvider_externalId: {
              sourceProvider: SourceProvider.KMDB,
              externalId: input.docId,
            },
          },
          create: {
            movieId,
            sourceProvider: SourceProvider.KMDB,
            externalId: input.docId,
            matchMethod: MatchMethod.AUTO,
            matchStatus: MatchStatus.APPROVED,
            confidence: 1,
            verifiedAt: new Date(),
          },
          update: {
            movieId,
            matchStatus: MatchStatus.APPROVED,
            verifiedAt: new Date(),
          },
        });

        if (input.title) {
          const existingTitle = await tx.movieTitle.findFirst({
            where: {
              movieId,
              title: input.title,
            },
          });

          if (!existingTitle) {
            await tx.movieTitle.create({
              data: {
                movieId,
                title: input.title,
                titleType: TitleType.ALIAS,
                languageCode: "ko",
              },
            });
          }
        }

        if (input.runtime !== null || input.overview !== null) {
          await tx.movie.update({
            where: { id: movieId },
            data: {
              ...(input.runtime !== null ? { runtime: input.runtime } : {}),
              ...(input.overview !== null
                ? { overview: input.overview }
                : {}),
            },
          });
        }

        const initialReleaseDate = input.releaseDates[0] ?? null;
        const rereleaseDates = input.releaseDates.slice(1);
        let releaseId: string | null = null;

        if (input.releaseDates.length > 0) {
          await tx.movieRelease.updateMany({
            where: { movieId },
            data: { isPrimary: false },
          });

          const initialStatus =
            initialReleaseDate && initialReleaseDate.getTime() > Date.now()
              ? ReleaseStatus.SCHEDULED
              : ReleaseStatus.RELEASED;

          const existingInitialRelease = await tx.movieRelease.findFirst({
            where: {
              movieId,
              releaseType: ReleaseType.INITIAL,
              OR: [
                { countryCode: "KR" },
                {
                  countryCode: null,
                  releaseDate: initialReleaseDate,
                },
              ],
            },
          });

          const initialRelease = existingInitialRelease
            ? await tx.movieRelease.update({
                where: { id: existingInitialRelease.id },
                data: {
                  releaseDate: initialReleaseDate,
                  countryCode: "KR",
                  status: initialStatus,
                  isPrimary: rereleaseDates.length === 0,
                },
              })
            : await tx.movieRelease.create({
                data: {
                  movieId,
                  releaseDate: initialReleaseDate,
                  releaseType: ReleaseType.INITIAL,
                  countryCode: "KR",
                  status: initialStatus,
                  isPrimary: rereleaseDates.length === 0,
                },
              });

          if (rereleaseDates.length === 0) {
            releaseId = initialRelease.id;
          }

          for (const [index, rereleaseDate] of rereleaseDates.entries()) {
            const rereleaseStatus =
              rereleaseDate.getTime() > Date.now()
                ? ReleaseStatus.SCHEDULED
                : ReleaseStatus.RELEASED;

            const existingRerelease = await tx.movieRelease.findFirst({
              where: {
                movieId,
                releaseType: ReleaseType.RERELEASE,
                releaseDate: rereleaseDate,
                OR: [{ countryCode: "KR" }, { countryCode: null }],
              },
            });

            const rerelease = existingRerelease
              ? await tx.movieRelease.update({
                  where: { id: existingRerelease.id },
                  data: {
                    countryCode: "KR",
                    status: rereleaseStatus,
                    isPrimary: index === rereleaseDates.length - 1,
                  },
                })
              : await tx.movieRelease.create({
                  data: {
                    movieId,
                    releaseDate: rereleaseDate,
                    releaseType: ReleaseType.RERELEASE,
                    countryCode: "KR",
                    status: rereleaseStatus,
                    isPrimary: index === rereleaseDates.length - 1,
                  },
                });

            if (index === rereleaseDates.length - 1) {
              releaseId = rerelease.id;
            }
          }
        }

        if (!input.posterUrl) {
          await tx.movieMedia.updateMany({
            where: {
              movieId,
              mediaType: MediaType.POSTER,
              sourceProvider: SourceProvider.KMDB,
              status: MediaStatus.ACTIVE,
              isPrimary: true,
            },
            data: {
              isPrimary: false,
              status: MediaStatus.INACTIVE,
            },
          });
        }

        if (input.posterUrl) {
          const existingMedia = await tx.movieMedia.findFirst({
            where: {
              movieId,
              mediaType: MediaType.POSTER,
              sourceProvider: SourceProvider.KMDB,
              externalId: input.posterUrl,
              releaseId: releaseId ?? null,
            },
          });

          await tx.movieMedia.updateMany({
            where: {
              movieId,
              mediaType: MediaType.POSTER,
              status: MediaStatus.ACTIVE,
              isPrimary: true,
              ...(existingMedia ? {id: {not: existingMedia.id}} : {}),
            },
            data: {
              isPrimary: false,
              status: MediaStatus.INACTIVE,
            },
          });

          if (existingMedia) {
            await tx.movieMedia.update({
              where: { id: existingMedia.id },
              data: {
                releaseId,
                url: input.posterUrl,
                isPrimary: true,
                status: MediaStatus.ACTIVE,
                verifiedAt: new Date(),
              },
            });
          } else {
            await tx.movieMedia.create({
              data: {
                movieId,
                releaseId,
                mediaType: MediaType.POSTER,
                sourceProvider: SourceProvider.KMDB,
                externalId: input.posterUrl,
                url: input.posterUrl,
                isPrimary: true,
                status: MediaStatus.ACTIVE,
                verifiedAt: new Date(),
              },
            });
          }
        }

        for (const [index, name] of input.genres.entries()) {
          await tx.movieGenre.upsert({
            where: {
              movieId_name: {
                movieId,
                name,
              },
            },
            create: {
              movieId,
              name,
              code: `KMDB_${index + 1}`,
            },
            update: {
              code: `KMDB_${index + 1}`,
            },
          });
        }

        const tmdbLink = await tx.movieProviderLink.findFirst({
          where: {
            movieId,
            sourceProvider: SourceProvider.TMDB,
            matchStatus: MatchStatus.APPROVED,
          },
          select: { id: true },
        });

        const creditsToSave = tmdbLink
          ? input.credits.filter(
              (credit) => credit.creditType === CreditType.DIRECTOR,
            )
          : input.credits;

        for (const [index, credit] of creditsToSave.entries()) {
          const person = await this.moviePersonService.resolve(tx, {
            name: credit.name,
            nameEn: credit.nameEn,
            sourceProvider: SourceProvider.KMDB,
            externalId: credit.externalId,
            movieId,
            creditType: credit.creditType,
          });

          await tx.movieCredit.upsert({
            where: {
              movieId_personId_creditType: {
                movieId,
                personId: person.id,
                creditType: credit.creditType,
              },
            },
            create: {
              movieId,
              personId: person.id,
              creditType: credit.creditType,
              displayOrder: index,
            },
            update: {
              displayOrder: index,
            },
          });
        }

        return movieId;
      },
      {
        maxWait: 10_000,
        timeout: 30_000,
      },
    );
  }
}
