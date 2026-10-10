import { BadRequestException, Injectable } from "@nestjs/common";

import { MovieNotFoundException } from "@/common/exceptions/movie-not-found.exception";

import { UserMovieRecordRepository } from "./repositories/user-movie-record.repository";
import { UpdateMovieRecordRequestDto } from "../auth/dto/requests/update-movie-record.request.dto";

@Injectable()
export class UserMovieRecordService {
  constructor(
    private readonly userMovieRecordRepository: UserMovieRecordRepository,
  ) {}

  async upsert(
    userId: string,
    movieId: string,
    input: UpdateMovieRecordRequestDto,
  ) {
    const hasInput =
      input.isFavorite !== undefined ||
      input.isWatched !== undefined ||
      input.watchedAt !== undefined ||
      input.rating !== undefined;

    if (!hasInput) {
      throw new BadRequestException("변경할 영화 기록이 없습니다.");
    }

    const movie = await this.userMovieRecordRepository.findMovie(movieId);

    if (!movie) {
      throw new MovieNotFoundException(movieId);
    }

    const record = await this.userMovieRecordRepository.upsert(
      userId,
      movieId,
      {
        isFavorite: input.isFavorite,

        watchedAt:
          input.isWatched === undefined
            ? input.watchedAt === undefined
              ? undefined
              : input.watchedAt
                ? new Date(`${input.watchedAt}T00:00:00.000Z`)
                : null
            : input.isWatched
              ? input.watchedAt
                ? new Date(`${input.watchedAt}T00:00:00.000Z`)
                : new Date()
              : null,

        rating: input.rating,
      },
    );

    return {
      ...record,
      rating: record.rating?.toString() ?? null,
      isWatched: record.watchedAt !== null,
    };
  }
  async findByUserAndMovie(userId: string, movieId: string) {
    const movie = await this.userMovieRecordRepository.findMovie(movieId);

    if (!movie) {
      throw new MovieNotFoundException(movieId);
    }

    const record = await this.userMovieRecordRepository.findByUserAndMovie(
      userId,
      movieId,
    );

    return {
      movieId,
      isFavorite: record?.isFavorite ?? false,
      isWatched: Boolean(record?.watchedAt),
      watchedAt: record?.watchedAt ?? null,
      rating: record?.rating?.toString() ?? null,
    };
  }
  async findAllByUser(userId: string) {
    const records = await this.userMovieRecordRepository.findAllByUser(userId);

    return records.map((record) => ({
      id: record.id,
      movieId: record.movie.id,
      title: record.movie.titles[0]?.title ?? "",
      posterUrl: record.movie.media[0]?.url ?? null,
      releaseDate: record.movie.releases[0]?.releaseDate ?? null,
      isFavorite: record.isFavorite,
      isWatched: Boolean(record.watchedAt),
      watchedAt: record.watchedAt,
      rating: record.rating?.toString() ?? null,
    }));
  }
}
