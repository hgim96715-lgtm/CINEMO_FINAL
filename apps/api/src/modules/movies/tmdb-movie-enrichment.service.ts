import { ConflictException, Injectable } from "@nestjs/common";
import {
  MatchMethod,
  MatchStatus,
  MediaStatus,
  MediaType,
  Prisma,
  SourceProvider,
  TitleType,
} from "@prisma/client";

import { TmdbService } from "@/integrations/tmdb/tmdb.service";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class TmdbMovieEnrichmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tmdbService: TmdbService,
  ) {}

  async enrichMovie(movieId: string, tmdbMovieId: number): Promise<string> {
    const tmdbMovie = await this.tmdbService.getMovieDetail(tmdbMovieId);
    const trailer = await this.tmdbService.getOfficialTrailer(tmdbMovieId);
    return this.prisma.$transaction(async (tx) => {
      await tx.movie.findUniqueOrThrow({
        where: { id: movieId },
      });

      const existingLink = await tx.movieProviderLink.findUnique({
        where: {
          sourceProvider_externalId: {
            sourceProvider: SourceProvider.TMDB,
            externalId: String(tmdbMovieId),
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
            externalId: String(tmdbMovieId),
          },
        },
        create: {
          movieId,
          sourceProvider: SourceProvider.TMDB,
          externalId: String(tmdbMovieId),
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
      const originalTitle = await tx.movieTitle.findFirst({
        where: {
          movieId,
          titleType: TitleType.ORIGINAL,
          title: tmdbMovie.original_title,
        },
      });
      if (!originalTitle && tmdbMovie.original_title) {
        await tx.movieTitle.create({
          data: {
            movieId,
            title: tmdbMovie.original_title,
            titleType: TitleType.ORIGINAL,
            languageCode: tmdbMovie.original_language,
          },
        });
      }
      for (const genre of tmdbMovie.genres) {
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
      // 포스터·배경·예고편의 원본 provider와 미디어 주소를 저장
      const createOrUpdateMedia = async (
        mediaType: MediaType,
        sourceProvider: SourceProvider,
        url: string,
        externalId: string,
      ) => {
        const existingMedia = await tx.movieMedia.findFirst({
          where: {
            movieId,
            sourceProvider,
            externalId,
          },
        });
        if (existingMedia) {
          await tx.movieMedia.update({
            where: {
              id: existingMedia.id,
            },
            data: {
              url,
              status: MediaStatus.ACTIVE,
              verifiedAt: new Date(),
            },
          });
          return;
        }
        const primaryMedia = await tx.movieMedia.findFirst({
          where: {
            movieId,
            mediaType,
            status: MediaStatus.ACTIVE,
            isPrimary: true,
          },
        });
        await tx.movieMedia.create({
          data: {
            movieId,
            mediaType,
            sourceProvider,
            url,
            externalId,
            isPrimary: !primaryMedia,
            status: MediaStatus.ACTIVE,
            verifiedAt: new Date(),
          },
        });
      };
      if (tmdbMovie.poster_path) {
        await createOrUpdateMedia(
          MediaType.POSTER,
          SourceProvider.TMDB,
          `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`,
          tmdbMovie.poster_path,
        );
      }

      if (tmdbMovie.backdrop_path) {
        await createOrUpdateMedia(
          MediaType.BACKDROP,
          SourceProvider.TMDB,
          `https://image.tmdb.org/t/p/w1280${tmdbMovie.backdrop_path}`,
          tmdbMovie.backdrop_path,
        );
      }
      if (trailer) {
        await createOrUpdateMedia(
          MediaType.TRAILER,
          SourceProvider.YOUTUBE,
          `https://www.youtube.com/watch?v=${trailer.key}`,
          trailer.key,
        );
      }
      return movieId;
    });
  }
}
