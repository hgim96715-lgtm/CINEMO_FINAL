import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

type UpsertUserMovieRecordInput = {
  isFavorite?: boolean;
  watchedAt?: Date | null;
  rating?: string | null;
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
        isFavorite: input.isFavorite ?? false,
        watchedAt: input.watchedAt ?? null,
        rating: input.rating ?? null,
      },
      update: updateData,
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
    });
  }
}
