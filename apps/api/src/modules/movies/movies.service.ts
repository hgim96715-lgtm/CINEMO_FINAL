import { BadRequestException, Injectable } from "@nestjs/common";

import { MovieNotFoundException } from "@/common/exceptions/movie-not-found.exception";

import { MovieResponseDto } from "./dto/responses/movie.response.dto";
import { MovieSitemapResponseDto } from "./dto/responses/movie-sitemap.response.dto";
import { MoviesRepository } from "./movies.repository";
import { toMovieResponseDto } from "./mappers/movie-response.mapper";
import { MovieSearchResponseDto } from "./dto/responses/movie-search.response.dto";
import { toMovieSearchItemResponseDto } from "./mappers/movie-search-response.mapper";
import { toMovieSitemapItemResponseDto } from "./mappers/movie-sitemap.mapper";
import {
  GetUpcomingMoviesRequestDto,
  UpcomingMoviesPeriod,
} from "./dto/requests/get-upcoming-movies.request.dto";
import { GetReleasedMoviesRequestDto } from "./dto/requests/get-released-movies.request.dto";

type UpcomingDateRange = {
  startDate: Date;
  endDate?: Date;
};

const CINEMO_TIME_ZONE = "Asia/Seoul";

const getTodayInCinemoTimeZone = (): Date => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CINEMO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day));
};

const getUpcomingDateRange = (
  params: GetUpcomingMoviesRequestDto,
): UpcomingDateRange => {
  if (params.period && params.yearMonth) {
    throw new BadRequestException(
      "period와 yearMonth는 동시에 사용할 수 없습니다.",
    );
  }
  const today = getTodayInCinemoTimeZone();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  if (params.period === UpcomingMoviesPeriod.THIS_WEEK) {
    const dayOfWeek = today.getUTCDay();
    const daysFromMonday = (dayOfWeek + 6) % 7;
    const weekStart = new Date(today);
    weekStart.setUTCDate(weekStart.getUTCDate() - daysFromMonday);
    const startDate = weekStart < tomorrow ? tomorrow : weekStart;
    const endDate = new Date(weekStart);
    endDate.setUTCDate(endDate.getUTCDate() + 7);

    return {
      startDate,
      endDate,
    };
  }

  if (params.yearMonth) {
    const [year, month] = params.yearMonth.split("-").map(Number);

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    if (
      startDate.getUTCFullYear() === today.getUTCFullYear() &&
      startDate.getUTCMonth() === today.getUTCMonth()
    ) {
      startDate.setTime(tomorrow.getTime());
    }

    return {
      startDate,
      endDate,
    };
  }

  return {
    startDate: tomorrow,
  };
};

const getReleasedDateRange = (
  params: GetReleasedMoviesRequestDto,
): { startDate: Date; endDate: Date } => {
  const today = getTodayInCinemoTimeZone();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  if (params.yearMonth) {
    const [year, month] = params.yearMonth.split("-").map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    // 이번 달은 내일 이후의 개봉일이 아직 지나지 않았으므로 제외함.
    if (
      startDate.getUTCFullYear() === today.getUTCFullYear() &&
      startDate.getUTCMonth() === today.getUTCMonth()
    ) {
      endDate.setTime(tomorrow.getTime());
    }

    return { startDate, endDate };
  }

  const startDate = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
  // 현재 월과 지난달은 개봉일 데이터가 아직 변동될 수 있으므로
  // 두 달 전까지의 영화만 올해 개봉작으로 확정해서 조회함.
  const cutoffDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1),
  );

  return {
    startDate,
    endDate: cutoffDate > startDate ? cutoffDate : startDate,
  };
};

@Injectable()
export class MoviesService {
  constructor(private readonly movieRepository: MoviesRepository) {}

  async findById(movieId: string): Promise<MovieResponseDto> {
    const movie = await this.movieRepository.findById(movieId);
    if (!movie) {
      throw new MovieNotFoundException(movieId);
    }
    return toMovieResponseDto(movie);
  }

  async search(
    query: string,
    page: number,
    limit: number,
  ): Promise<MovieSearchResponseDto> {
    const { movies, totalCount } = await this.movieRepository.search(
      query,
      page,
      limit,
    );

    return {
      items: movies.map((movie) => toMovieSearchItemResponseDto(movie, null)),
      totalCount,
      page,
      limit,
    };
  }

  async getSitemapMovies(): Promise<MovieSitemapResponseDto> {
    const movies = await this.movieRepository.findSitemapMovies();

    return {
      items: movies.map(toMovieSitemapItemResponseDto),
    };
  }

  async getPopularMovies(
    page: number,
    limit: number,
  ): Promise<MovieSearchResponseDto> {
    const { movies, totalCount } = await this.movieRepository.findPopularMovies(
      page,
      limit,
    );

    return {
      items: movies.map((movie) => toMovieSearchItemResponseDto(movie)),
      totalCount,
      page,
      limit,
    };
  }

  async getMovieRankings(
    page: number,
    limit: number,
  ): Promise<MovieSearchResponseDto> {
    const { movies, totalCount } = await this.movieRepository.findMovieRankings(
      page,
      limit,
    );

    return {
      items: movies.map(
        ({ movie, rank, rankChange, audienceCount, totalAudienceCount }) =>
          toMovieSearchItemResponseDto(movie, rank, {
            rankChange,
            audienceCount,
            totalAudienceCount,
          }),
      ),
      totalCount,
      page,
      limit,
    };
  }

  async getUpcomingMovies(
    params: GetUpcomingMoviesRequestDto,
  ): Promise<MovieSearchResponseDto> {
    const dateRange = getUpcomingDateRange(params);
    const { movies, totalCount } =
      await this.movieRepository.findUpcomingMovies(
        params.page,
        params.limit,
        dateRange,
      );

    return {
      items: movies.map((movie) => toMovieSearchItemResponseDto(movie)),
      totalCount,
      page: params.page,
      limit: params.limit,
    };
  }

  async getReleasedMovies(
    params: GetReleasedMoviesRequestDto,
  ): Promise<MovieSearchResponseDto> {
    const dateRange = getReleasedDateRange(params);
    const { movies, totalCount } =
      await this.movieRepository.findReleasedMovies(
        params.page,
        params.limit,
        dateRange,
      );

    return {
      items: movies.map((movie) => toMovieSearchItemResponseDto(movie)),
      totalCount,
      page: params.page,
      limit: params.limit,
    };
  }
}
