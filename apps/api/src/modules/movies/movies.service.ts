import { Injectable } from "@nestjs/common";

import { MovieNotFoundException } from "@/common/exceptions/movie-not-found.exception";

import { MovieResponseDto } from "./dto/responses/movie.response.dto";
import { MoviesRepository } from "./movies.repository";
import { toMovieResponseDto } from "./mappers/movie-response.mapper";
import { MovieSearchResponseDto } from "./dto/responses/movie-search.response.dto";
import { toMovieSearchItemResponseDto } from "./mappers/movie-search-response.mapper";

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
      items: movies.map(toMovieSearchItemResponseDto),
      totalCount,
      page,
      limit,
    };
  }
}
