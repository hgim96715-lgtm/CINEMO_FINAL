import { Injectable } from "@nestjs/common";

import { MovieNotFoundException } from "@/common/exceptions/movie-not-found.exception";

import { MovieResponseDto } from "./dto/responses/movie.response.dto";
import { MovieSitemapResponseDto } from "./dto/responses/movie-sitemap.response.dto";
import { MoviesRepository } from "./movies.repository";
import { toMovieResponseDto } from "./mappers/movie-response.mapper";
import { MovieSearchResponseDto } from "./dto/responses/movie-search.response.dto";
import { toMovieSearchItemResponseDto } from "./mappers/movie-search-response.mapper";
import { toMovieSitemapItemResponseDto } from "./mappers/movie-sitemap.mapper";

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
}
