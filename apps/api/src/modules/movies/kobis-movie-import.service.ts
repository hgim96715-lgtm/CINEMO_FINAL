import { ConflictException, Injectable } from "@nestjs/common";
import {
  CreditType,
  MatchMethod,
  MatchStatus,
  Prisma,
  ReleaseStatus,
  ReleaseType,
  SourceProvider,
  TitleType,
} from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";
import { KobisService } from "@/integrations/kobis/kobis.service";
import type { KobisMovieInfoResponseDto } from "@/integrations/kobis/dto/responses/kobis-movie-info.response.dto";
import { MovieMatcherService } from "./movie-matcher.service";

function parseKobisDate(value: string | null): Date | null {
  if (!value || !/^\d{8}$/.test(value)) {
    return null;
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6)) - 1;
  const day = Number(value.slice(6, 8));

  return new Date(Date.UTC(year, month, day));
}

function getReleaseStatus(releaseDate: Date | null): ReleaseStatus {
  if (!releaseDate) {
    return ReleaseStatus.ANNOUNCED;
  }

  return releaseDate.getTime() > Date.now()
    ? ReleaseStatus.SCHEDULED
    : ReleaseStatus.RELEASED;
}

@Injectable()
export class KobisMovieImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kobisService: KobisService,
    private readonly movieMatcher: MovieMatcherService,
  ) {}

  async importMovie(movieCd: string): Promise<string> {
    // movieCd: KOBIS가 발급한 외부 영화 식별자
    // kobisMovie: KOBIS 상세 API에서 받은 영화 정보 객체
    const kobisMovie = await this.kobisService.getMovieInfo(movieCd);
    return this.prisma.$transaction(async (tx) => {
      const releaseDate = parseKobisDate(kobisMovie.releaseDate);

      const existingLink = await tx.movieProviderLink.findUnique({
        where: {
          sourceProvider_externalId: {
            sourceProvider: SourceProvider.KOBIS,
            externalId: kobisMovie.movieCd,
          },
        },
      });

      let movieId: string;

      if (existingLink) {
        // 이미 KOBIS 외부 ID와 연결된 Movie의 내부 UUID 사용
        movieId = existingLink.movieId;
      } else {
        const candidates = await this.movieMatcher.findCandidates(
          kobisMovie.title,
          releaseDate,
        );

        if (candidates.length > 1) {
          throw new ConflictException({
            code: "MOVIE_MATCH_REVIEW_REQUIRED",
            message: "동일한 영화 후보가 여러 개라 관리자 검토가 필요합니다.",
            candidateMovieIds: candidates.map((candidate) => candidate.id),
          });
        }

        if (candidates.length === 1) {
          // 기존 후보 Movie에 KOBIS 외부 ID 연결
          movieId = candidates[0].id;
        } else {
          // 기존 후보가 없을 때만 새 Movie와 내부 UUID 생성
          const createdMovie = await tx.movie.create({
            data: {},
          });
          movieId = createdMovie.id;
        }
      }

      // movie: CINEMO DB의 Movie 테이블에서 조회하거나 새로 만든 영화 객체
      // movie.id: 기존 Movie의 내부 UUID이거나 Prisma가 새로 생성한 내부 UUID
      const movie = await tx.movie.findUniqueOrThrow({
        where: { id: movieId },
      });
      const releaseStatus = getReleaseStatus(releaseDate);

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
            releaseDate,
            releaseType: ReleaseType.INITIAL,
            status: releaseStatus,
            isPrimary: true,
          },
        }));

      await tx.movieRelease.update({
        where: {
          id: release.id,
        },
        data: {
          releaseDate,
          status: releaseStatus,
          isPrimary: true,
        },
      });

      await tx.movieProviderLink.upsert({
        where: {
          sourceProvider_externalId: {
            sourceProvider: SourceProvider.KOBIS,
            externalId: kobisMovie.movieCd,
          },
        },
        create: {
          movieId: movie.id,
          sourceProvider: SourceProvider.KOBIS,
          externalId: kobisMovie.movieCd,
          matchMethod: MatchMethod.AUTO,
          matchStatus: MatchStatus.APPROVED,
          confidence: new Prisma.Decimal("1.0000"),
          verifiedAt: new Date(),
        },
        update: {
          movieId: movie.id,
          matchMethod: MatchMethod.AUTO,
          matchStatus: MatchStatus.APPROVED,
          confidence: new Prisma.Decimal("1.0000"),
          verifiedAt: new Date(),
        },
      });

      const existingPrimaryTitle = await tx.movieTitle.findFirst({
        where: {
          movieId: movie.id,
          titleType: TitleType.PRIMARY,
        },
        select: {
          id: true,
        },
      });

      if (existingPrimaryTitle) {
        await tx.movieTitle.update({
          where: {
            id: existingPrimaryTitle.id,
          },
          data: {
            title: kobisMovie.title,
            releaseId: release.id,
          },
        });
      } else {
        await tx.movieTitle.create({
          data: {
            movieId: movie.id,
            releaseId: release.id,
            title: kobisMovie.title,
            titleType: TitleType.PRIMARY,
          },
        });
      }

      for (const [index, genreName] of kobisMovie.genres.entries()) {
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
          },
          update: {
            code: `KOBIS_${index + 1}`,
          },
        });
      }

      const credits = [
        ...kobisMovie.directors.map((name) => ({
          name,
          creditType: CreditType.DIRECTOR,
        })),
        ...kobisMovie.actors.map((name) => ({
          name,
          creditType: CreditType.ACTOR,
        })),
      ];

      for (const [index, credit] of credits.entries()) {
        const person =
          (await tx.moviePerson.findFirst({
            where: { name: credit.name },
          })) ??
          (await tx.moviePerson.create({
            data: { name: credit.name },
          }));

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
      // Controller에서는 Prisma 결과를 직접 반환하지 않고 내부 영화 ID만 전달
      // 이후 MoviesService가 Response DTO로 변환
      return movie.id;
    });
  }
}
