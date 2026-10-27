import {ConflictException, Injectable} from "@nestjs/common";
import {
  AvailabilityType,
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
  WatchProvider,
} from "@prisma/client";

import {PrismaService} from "@/prisma/prisma.service";

import {MoviePersonService} from "../movie-person.service";

export type TmdbMovieCreditInput = {
  name: string;
  nameEn: string | null;
  externalId: string;
  creditType: CreditType;
  characterName: string | null;
};

export type TmdbMovieMediaInput = {
  mediaType: MediaType;
  sourceProvider: SourceProvider;
  url: string;
  externalId: string;
};

export type TmdbWatchOptionInput = {
  watchProvider: WatchProvider;
  tmdbProviderId: number;
  logoPath: string | null;
  availabilityType: AvailabilityType;
  regionCode: string;
  url: string;
};

export type SaveTmdbMovieInput = {
  tmdbMovieId: number;
  releaseDate: Date | null;
  title: string | null;
  originalTitle: string | null;
  originalLanguage: string;
  genres: Array<{id: number; name: string}>;
  credits: TmdbMovieCreditInput[];
  media: TmdbMovieMediaInput[];
  watchOptions: TmdbWatchOptionInput[];
  overview: string | null;
  runtime: number | null;
  voteAverage: number;
  voteCount: number;
  productionCountryCodes: string[];
};

const normalizeTitle = (title: string): string =>
  title.trim().replace(/\s+/g, " ").toLocaleLowerCase();

@Injectable()
export class TmdbMovieSyncRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moviePersonService: MoviePersonService,
  ) {}

  syncMovie(movieId: string, input: SaveTmdbMovieInput): Promise<string> {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.movie.findUniqueOrThrow({
          where: { id: movieId },
        });

        const externalId = String(input.tmdbMovieId);
        const existingLink = await tx.movieProviderLink.findUnique({
          where: {
            sourceProvider_externalId: {
              sourceProvider: SourceProvider.TMDB,
              externalId,
            },
          },
        });

        if (existingLink && existingLink.movieId !== movieId) {
          throw new ConflictException(
            "TMDB 영화가 다른 CINEMO 영화와 이미 연결되어 있습니다.",
          );
        }

        await tx.movieProviderLink.upsert({
          where: {
            sourceProvider_externalId: {
              sourceProvider: SourceProvider.TMDB,
              externalId,
            },
          },
          create: {
            movieId,
            sourceProvider: SourceProvider.TMDB,
            externalId,
            matchMethod: MatchMethod.AUTO,
            matchStatus: MatchStatus.APPROVED,
            confidence: new Prisma.Decimal("1.0000"),
            verifiedAt: new Date(),
          },
          update: {
            movieId,
            matchStatus: MatchStatus.APPROVED,
            confidence: new Prisma.Decimal("1.0000"),
            verifiedAt: new Date(),
          },
        });

        if (input.releaseDate) {
          const existingTmdbRelease = await tx.movieRelease.findFirst({
            where: {
              movieId,
              releaseType: ReleaseType.INITIAL,
              countryCode: null,
            },
          });

          const hasKoreanRelease = await tx.movieRelease.findFirst({
            where: {
              movieId,
              countryCode: "KR",
            },
            select: { id: true },
          });

          const releaseData = {
            releaseDate: input.releaseDate,
            status:
              input.releaseDate.getTime() > Date.now()
                ? ReleaseStatus.SCHEDULED
                : ReleaseStatus.RELEASED,
            isPrimary: !hasKoreanRelease,
          };

          if (existingTmdbRelease) {
            await tx.movieRelease.update({
              where: { id: existingTmdbRelease.id },
              data: releaseData,
            });
          } else {
            await tx.movieRelease.create({
              data: {
                movieId,
                releaseType: ReleaseType.INITIAL,
                countryCode: null,
                ...releaseData,
              },
            });
          }
        }

        const primaryRelease = await tx.movieRelease.findFirst({
          where: {
            movieId,
            isPrimary: true,
          },
          select: {
            id: true,
          },
        });

        const primaryTitle = await tx.movieTitle.findFirst({
          where: {
            movieId,
            titleType: TitleType.PRIMARY,
          },
        });

        if (!primaryTitle && input.title) {
          await tx.movieTitle.create({
            data: {
              movieId,
              releaseId: primaryRelease?.id ?? null,
              title: input.title,
              titleType: TitleType.PRIMARY,
              languageCode: /[가-힣]/.test(input.title)
                ? "ko"
                : input.originalLanguage,
            },
          });
        } else if (primaryTitle && primaryRelease) {
          await tx.movieTitle.update({
            where: { id: primaryTitle.id },
            data: { releaseId: primaryRelease.id },
          });
        }

        const originalTitle = await tx.movieTitle.findFirst({
          where: {
            movieId,
            titleType: TitleType.ORIGINAL,
            title: input.originalTitle ?? undefined,
          },
        });

        const hasSamePrimaryTitle =
          !!primaryTitle &&
          !!input.originalTitle &&
          normalizeTitle(primaryTitle.title) ===
            normalizeTitle(input.originalTitle);

        if (originalTitle && hasSamePrimaryTitle) {
          await tx.movieTitle.delete({
            where: { id: originalTitle.id },
          });
        } else if (
          !originalTitle &&
          input.originalTitle &&
          !hasSamePrimaryTitle
        ) {
          await tx.movieTitle.create({
            data: {
              movieId,
              title: input.originalTitle,
              titleType: TitleType.ORIGINAL,
              languageCode: input.originalLanguage,
            },
          });
        }

        for (const genre of input.genres) {
          const existingGenre = await tx.movieGenre.findFirst({
            where: {
              movieId,
              name: genre.name,
            },
          });

          if (!existingGenre) {
            await tx.movieGenre.create({
              data: {
                movieId,
                code: `TMDB_${genre.id}`,
                name: genre.name,
              },
            });
          }
        }

        for (const [index, credit] of input.credits.entries()) {
          const person = await this.moviePersonService.resolve(tx, {
            name: credit.name,
            nameEn: credit.nameEn,
            sourceProvider: SourceProvider.TMDB,
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
              characterName: credit.characterName,
              displayOrder: index,
            },
            update: {
              characterName: credit.characterName ?? undefined,
              displayOrder: index,
            },
          });
        }

        for (const media of input.media) {
          const existingMedia = await tx.movieMedia.findFirst({
            where: {
              movieId,
              sourceProvider: media.sourceProvider,
              externalId: media.externalId,
            },
          });

          await tx.movieMedia.updateMany({
            where: {
              movieId,
              mediaType: media.mediaType,
              status: MediaStatus.ACTIVE,
              isPrimary: true,
              ...(existingMedia ? { id: { not: existingMedia.id } } : {}),
            },
            data: {
              isPrimary: false,
              status: MediaStatus.INACTIVE,
            },
          });

          if (existingMedia) {
            await tx.movieMedia.update({
              where: {
                id: existingMedia.id,
              },
              data: {
                url: media.url,
                status: MediaStatus.ACTIVE,
                isPrimary: true,
                verifiedAt: new Date(),
              },
            });
            continue;
          }

          await tx.movieMedia.create({
            data: {
              movieId,
              mediaType: media.mediaType,
              sourceProvider: media.sourceProvider,
              url: media.url,
              externalId: media.externalId,
              isPrimary: true,
              status: MediaStatus.ACTIVE,
              verifiedAt: new Date(),
            },
          });
        }

        await tx.movieWatchOption.deleteMany({
          where: {
            movieId,
            regionCode: "KR",
          },
        });

        if (input.watchOptions.length > 0) {
          await tx.movieWatchOption.createMany({
            data: input.watchOptions.map((option) => ({
              movieId,
              watchProvider: option.watchProvider,
              tmdbProviderId: option.tmdbProviderId,
              logoPath: option.logoPath,
              availabilityType: option.availabilityType,
              regionCode: option.regionCode,
              url: option.url,
              lastVerifiedAt: new Date(),
            })),
          });
        }

        await tx.movie.update({
          where: { id: movieId },
          data: {
            overview: input.overview,
            runtime: input.runtime,
            tmdbVoteAverage: new Prisma.Decimal(input.voteAverage.toFixed(1)),
            tmdbVoteCount: input.voteCount,
            ...(input.productionCountryCodes.length > 0
              ? { productionCountryCodes: input.productionCountryCodes }
              : {}),
          },
        });

        return movieId;
      },
      {
        maxWait: 10_000,
        timeout: 30_000,
      },
    );
  }

  syncKoreanReleaseDates(
    movieId: string,
    releaseDates: Date[],
  ): Promise<string> {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.movie.findUniqueOrThrow({
          where: {id: movieId},
        });

        const uniqueDates = [
          ...new Map(
            releaseDates.map((date) => [
              date.toISOString().slice(0, 10),
              date,
            ]),
          ).values(),
        ].sort((a, b) => a.getTime() - b.getTime());

        if (uniqueDates.length === 0) {
          return movieId;
        }

        const initialRelease = await tx.movieRelease.findFirst({
          where: {
            movieId,
            releaseType: ReleaseType.INITIAL,
            OR: [{countryCode: "KR"}, {countryCode: null}],
          },
          orderBy: {releaseDate: "asc"},
        });

        const initialReleaseDate =
          initialRelease?.releaseDate ?? uniqueDates[0];

        for (const releaseDate of uniqueDates) {
          const existingRelease = await tx.movieRelease.findFirst({
            where: {
              movieId,
              releaseDate,
              OR: [{countryCode: "KR"}, {countryCode: null}],
            },
          });

          const releaseType =
            initialReleaseDate.getTime() !== releaseDate.getTime()
              ? ReleaseType.RERELEASE
              : (existingRelease?.releaseType ?? ReleaseType.INITIAL);
          const status =
            releaseDate.getTime() > Date.now()
              ? ReleaseStatus.SCHEDULED
              : ReleaseStatus.RELEASED;

          if (existingRelease) {
            await tx.movieRelease.update({
              where: {id: existingRelease.id},
              data: {
                countryCode: "KR",
                releaseType,
                status,
              },
            });
            continue;
          }

          await tx.movieRelease.create({
            data: {
              movieId,
              releaseDate,
              releaseType,
              status,
              countryCode: "KR",
              isPrimary: false,
            },
          });
        }

        const latestKoreanRelease = await tx.movieRelease.findFirst({
          where: {
            movieId,
            countryCode: "KR",
            releaseDate: {not: null},
          },
          orderBy: {releaseDate: "desc"},
          select: {id: true},
        });

        await tx.movieRelease.updateMany({
          where: {movieId},
          data: {isPrimary: false},
        });

        if (latestKoreanRelease) {
          await tx.movieRelease.update({
            where: {id: latestKoreanRelease.id},
            data: {isPrimary: true},
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
