import {Injectable} from "@nestjs/common";
import {MediaType, Prisma, TitleType, ViewingPlaceType} from "@prisma/client";

import {PrismaService} from "@/prisma/prisma.service";

type UpsertUserMovieRecordInput = {
  isFavorite?: boolean;
  watchedAt?: Date | null;
  rating?: string | null;
  venueId?: string | null;
  viewingPlaceType?: ViewingPlaceType | null;
};

@Injectable()
export class UserMovieRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMovie(movieId: string) {
    return this.prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true },
    });
  }

  async upsert(
    userId: string,
    movieId: string,
    input: UpsertUserMovieRecordInput,
  ) {
    const updateData: Prisma.UserMovieRecordUpdateInput = {};

    if (input.isFavorite !== undefined) {
      updateData.isFavorite = input.isFavorite;
    }

    if (input.watchedAt !== undefined) {
      updateData.watchedAt = input.watchedAt;
    }

    if (input.rating !== undefined) {
      updateData.rating = input.rating;
    }

    if (input.venueId !== undefined) {
      updateData.venue = input.venueId
        ? {
            connect: {
              id: input.venueId,
            },
          }
        : {
            disconnect: true,
          };
    }

    if (input.viewingPlaceType !== undefined) {
      updateData.viewingPlaceType = input.viewingPlaceType;
    }

    return this.prisma.userMovieRecord.upsert({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
      create: {
        userId,
        movieId,
        venueId: input.venueId ?? null,
        viewingPlaceType: input.viewingPlaceType ?? null,
        isFavorite: input.isFavorite ?? false,
        watchedAt: input.watchedAt ?? null,
        rating: input.rating ?? null,
      },
      update: updateData,
      include: {
        venue: {
          select: {
            id: true,
            type: true,
            name: true,
            brandName: true,
            roadAddress: true,
            jibunAddress: true,
          },
        },
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.userMovieRecord.findMany({
      where: {
        userId,
        OR: [
          { isFavorite: true },
          { watchedAt: { not: null } },
          { rating: { not: null } },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        isFavorite: true,
        watchedAt: true,
        rating: true,
        venueId: true,
        viewingPlaceType: true,
        venue: {
          select: {
            id: true,
            type: true,
            name: true,
            brandName: true,
            roadAddress: true,
            jibunAddress: true,
          },
        },
        movie: {
          select: {
            id: true,
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
                isPrimary: true,
              },
              orderBy: {
                releaseDate: "asc",
              },
              take: 1,
              select: {
                releaseDate: true,
              },
            },
            media: {
              where: {
                mediaType: MediaType.POSTER,
                isPrimary: true,
              },
              orderBy: {
                createdAt: "asc",
              },
              take: 1,
              select: {
                url: true,
              },
            },
          },
        },
      },
    });
  }

  async findByUserAndMovie(userId: string, movieId: string) {
    return this.prisma.userMovieRecord.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
      include: {
        venue: {
          select: {
            id: true,
            type: true,
            name: true,
            brandName: true,
            roadAddress: true,
            jibunAddress: true,
          },
        },
      },
    });
  }
}
