import { Injectable } from "@nestjs/common";

import { MovieNotFoundException } from "@/common/exceptions/movie-not-found.exception";

import { MovieResponseDto } from "./dto/responses/movie.response.dto";
import { MoviesRepository } from "./movies.repository";
import { toMovieResponseDto } from "./mappers/movie-response.mapper";

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
}
