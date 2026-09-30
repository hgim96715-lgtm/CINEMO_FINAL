// apps/api/src/modules/movies/kmdb-movie-enrichment.service.ts

import { Injectable, NotFoundException } from "@nestjs/common";
import {
  CreditType,
  MatchMethod,
  MatchStatus,
  MediaStatus,
  MediaType,
  ReleaseStatus,
  ReleaseType,
  SourceProvider,
  TitleType,
} from "@prisma/client";

import { KmdbService } from "@/integrations/kmdb/kmdb.service";
import type { KmdbMovieResult } from "@/integrations/kmdb/types/kmdb-response.type";
import { PrismaService } from "@/prisma/prisma.service";

import { MoviePersonService } from "./movie-person.service";

const cleanText = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  return value
    .replace(/!HS|!HE/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const toStringArray = (value?: string | string[] | null): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return value
    ? value
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
};

const parseKmdbDate = (value?: string | null): Date | null => {
  if (!value || !/^\d{8}$/.test(value)) {
    return null;
  }

  return new Date(
    Date.UTC(
      Number(value.slice(0, 4)),
      Number(value.slice(4, 6)) - 1,
      Number(value.slice(6, 8)),
    ),
  );
};

const getReleaseDate = (movie: KmdbMovieResult): Date | null => {
  const dates =
    movie.ratings?.rating
      ?.map((rating) => parseKmdbDate(rating.releaseDate))
      .filter((date): date is Date => date !== null)
      .sort((a, b) => b.getTime() - a.getTime()) ?? [];

  return dates[0] ?? null;
};

@Injectable()
export class KmdbMovieEnrichmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kmdbService: KmdbService,
    private readonly moviePersonService: MoviePersonService,
  ) {}

  async enrichMovie(movieId: string, docId: string): Promise<string> {
    const title = await this.prisma.movieTitle.findFirst({
      where: { movieId },
      orderBy: { createdAt: "asc" },
    });

    if (!title) {
      throw new NotFoundException("영화 제목을 찾을 수 없습니다.");
    }
    const kmdbMovie = await this.kmdbService.getMovieByDocId(
      docId,
      title.title,
    );

    if (!kmdbMovie) {
      throw new NotFoundException("KMDb 영화를 찾을 수 없습니다.");
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.movie.findUniqueOrThrow({
        where: { id: movieId },
      });

      await tx.movieProviderLink.upsert({
        where: {
          sourceProvider_externalId: {
            sourceProvider: SourceProvider.KMDB,
            externalId: kmdbMovie.DOCID,
          },
        },
        create: {
          movieId,
          sourceProvider: SourceProvider.KMDB,
          externalId: kmdbMovie.DOCID,
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

      const title = cleanText(kmdbMovie.title);

      if (title) {
        const existingTitle = await tx.movieTitle.findFirst({
          where: {
            movieId,
            title,
          },
        });

        if (!existingTitle) {
          await tx.movieTitle.create({
            data: {
              movieId,
              title,
              titleType: TitleType.ALIAS,
              languageCode: "ko",
            },
          });
        }
      }

      const releaseDate = getReleaseDate(kmdbMovie);
      let releaseId: string | undefined;

      if (releaseDate) {
        await tx.movieRelease.updateMany({
          where: { movieId },
          data: { isPrimary: false },
        });

        const existingRelease = await tx.movieRelease.findFirst({
          where: {
            movieId,
            releaseType: ReleaseType.RERELEASE,
            releaseDate,
          },
        });

        const status =
          releaseDate.getTime() > Date.now()
            ? ReleaseStatus.SCHEDULED
            : ReleaseStatus.RELEASED;

        const release = existingRelease
          ? await tx.movieRelease.update({
              where: { id: existingRelease.id },
              data: {
                status,
                isPrimary: true,
              },
            })
          : await tx.movieRelease.create({
              data: {
                movieId,
                releaseDate,
                releaseType: ReleaseType.RERELEASE,
                status,
                isPrimary: true,
              },
            });

        releaseId = release.id;
      }

      const posterUrl = toStringArray(kmdbMovie.posters)[0];

      if (posterUrl) {
        const existingMedia = await tx.movieMedia.findFirst({
          where: {
            movieId,
            mediaType: MediaType.POSTER,
            sourceProvider: SourceProvider.KMDB,
            externalId: posterUrl,
            releaseId: releaseId ?? null,
          },
        });

        if (existingMedia) {
          await tx.movieMedia.update({
            where: { id: existingMedia.id },
            data: {
              releaseId,
              url: posterUrl,
              status: MediaStatus.ACTIVE,
              verifiedAt: new Date(),
            },
          });
        } else {
          const primaryMedia = await tx.movieMedia.findFirst({
            where: {
              movieId,
              mediaType: MediaType.POSTER,
              releaseId: releaseId ?? null,
              status: MediaStatus.ACTIVE,
              isPrimary: true,
            },
          });

          await tx.movieMedia.create({
            data: {
              movieId,
              releaseId,
              mediaType: MediaType.POSTER,
              sourceProvider: SourceProvider.KMDB,
              externalId: posterUrl,
              url: posterUrl,
              isPrimary: !primaryMedia,
              status: MediaStatus.ACTIVE,
              verifiedAt: new Date(),
            },
          });
        }
      }

      const genres =
        cleanText(kmdbMovie.genre)
          ?.split(",")
          .map((genre) => genre.trim())
          .filter(Boolean) ?? [];

      for (const [index, name] of genres.entries()) {
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

      const credits = [
        ...(kmdbMovie.directors?.director ?? []).map((person) => ({
          name: cleanText(person.directorNm),
          nameEn: cleanText(person.directorEnNm),
          externalId: cleanText(person.directorId),
          creditType: CreditType.DIRECTOR,
        })),
        ...(kmdbMovie.actors?.actor ?? []).map((person) => ({
          name: cleanText(person.actorNm),
          nameEn: cleanText(person.actorEnNm),
          externalId: cleanText(person.actorId),
          creditType: CreditType.ACTOR,
        })),
      ].filter(
        (
          credit,
        ): credit is {
          name: string;
          nameEn: string | null;
          externalId: string | null;
          creditType: CreditType;
        } => Boolean(credit.name),
      );

      for (const [index, credit] of credits.entries()) {
        const person = await this.moviePersonService.resolve(tx, {
          name: credit.name,
          nameEn: credit.nameEn,
          sourceProvider: SourceProvider.KMDB,
          externalId: credit.externalId,
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
    });
  }
}
