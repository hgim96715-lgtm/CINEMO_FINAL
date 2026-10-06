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

  if (params.period === UpcomingMoviesPeriod.THIS_WEEK) {
    const dayOfWeek = today.getUTCDay();
    const daysFromMonday = (dayOfWeek + 6) % 7;
    const startDate = new Date(today);
    startDate.setUTCDate(startDate.getUTCDate() - daysFromMonday);
    const endDate = new Date(startDate);
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

    return {
      startDate,
      endDate,
    };
  }

  return {
    startDate: today,
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
}
