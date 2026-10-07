// apps/api/src/modules/movies/kmdb-movie-enrichment.service.ts

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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

const normalizeTitle = (value?: string | null): string =>
  cleanText(value)?.toLocaleLowerCase("ko-KR").replace(/[^\p{L}\p{N}]/gu, "") ??
  "";

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

const parseRuntime = (
  ...values: Array<string | number | null | undefined>
): number | null => {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }

    const runtime = Number(String(value).trim());

    if (Number.isInteger(runtime) && runtime > 0) {
      return runtime;
    }
  }

  return null;
};

const getKmdbOverview = (movie: KmdbMovieResult): string | null => {
  const plots = movie.plots?.plot ?? [];
  const plot =
    plots.find((item) => item.plotLang === "한국어")?.plotText ??
    plots[0]?.plotText;

  return cleanText(plot);
};

const getReleaseDates = (movie: KmdbMovieResult): Date[] => {
  const dates =
    movie.ratings?.rating
      ?.flatMap((rating) =>
        toStringArray(rating.releaseDate).map(parseKmdbDate),
      )
      .filter((date): date is Date => date !== null)
      .sort((a, b) => a.getTime() - b.getTime()) ?? [];

  return [
    ...new Map(
      dates.map((date) => [date.toISOString().slice(0, 10), date]),
    ).values(),
  ];
};

@Injectable()
export class KmdbMovieEnrichmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kmdbService: KmdbService,
    private readonly moviePersonService: MoviePersonService,
  ) {}

  async enrichMovieByMovieId(movieId: string): Promise<string> {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
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

    if (!movie) {
      throw new NotFoundException("영화를 찾을 수 없습니다.");
    }

    const title = movie.titles[0]?.title;

    if (!title) {
      throw new NotFoundException("영화 대표 제목을 찾을 수 없습니다.");
    }

    const results = await this.kmdbService.searchMovieResults(title);
    const normalizedTitle = normalizeTitle(title);
    const titleMatchedResults = results.filter((result) =>
      [result.title, result.titleOrg, result.titleEng].some(
        (candidateTitle) => normalizeTitle(candidateTitle) === normalizedTitle,
      ),
    );

    const releaseYear = movie.releases[0]?.releaseDate?.getUTCFullYear();
    const yearMatchedResults = releaseYear
      ? titleMatchedResults.filter(
          (result) => result.prodYear === String(releaseYear),
        )
      : [];

    const candidates =
      yearMatchedResults.length > 0
        ? yearMatchedResults
        : titleMatchedResults;

    if (candidates.length === 0) {
      throw new NotFoundException(
        `KMDb에서 '${title}'와 일치하는 영화를 찾을 수 없습니다.`,
      );
    }

    if (candidates.length > 1) {
      throw new ConflictException({
        code: "KMDB_MOVIE_MATCH_REVIEW_REQUIRED",
        message: "KMDb 후보가 여러 개라 수동 확인이 필요합니다.",
        candidates: candidates.map((candidate) => ({
          docId: candidate.DOCID,
          title: cleanText(candidate.title),
          productionYear: candidate.prodYear ?? null,
          kmdbUrl: candidate.kmdbUrl ?? null,
        })),
      });
    }

    return this.enrichMovie(movieId, candidates[0].DOCID);
  }

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

    const runtime = parseRuntime(
      kmdbMovie.runtime,
      ...(kmdbMovie.ratings?.rating ?? []).map((rating) => rating.runtime),
    );
    const overview = getKmdbOverview(kmdbMovie);

    return this.prisma.$transaction(
      async (tx) => {
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

      const releaseDates = getReleaseDates(kmdbMovie);
      const initialReleaseDate = releaseDates[0] ?? null;
      const rereleaseDates = releaseDates.slice(1);
      let releaseId: string | null = null;

      if (runtime !== null || overview !== null) {
        await tx.movie.update({
          where: { id: movieId },
          data: {
            ...(runtime !== null ? { runtime } : {}),
            ...(overview !== null ? { overview } : {}),
          },
        });
      }

      if (releaseDates.length > 0) {
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

        if (releaseId) {
          await tx.movieMedia.updateMany({
            where: {
              movieId,
              mediaType: MediaType.POSTER,
              releaseId,
              status: MediaStatus.ACTIVE,
              isPrimary: true,
            },
            data: {
              isPrimary: false,
            },
          });
        }

        if (existingMedia) {
          await tx.movieMedia.update({
            where: { id: existingMedia.id },
            data: {
              releaseId,
              url: posterUrl,
              isPrimary: releaseId ? true : existingMedia.isPrimary,
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
              isPrimary: releaseId ? true : !primaryMedia,
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

      const tmdbLink = await tx.movieProviderLink.findFirst({
        where: {
          movieId,
          sourceProvider: SourceProvider.TMDB,
          matchStatus: MatchStatus.APPROVED,
        },
        select: { id: true },
      });

      // TMDB가 연결된 영화는 TMDB 크레딧을 우선하고,
      // TMDB가 없는 영화만 KMDB 크레딧을 추가함.
      if (!tmdbLink) {
        for (const [index, credit] of credits.entries()) {
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
