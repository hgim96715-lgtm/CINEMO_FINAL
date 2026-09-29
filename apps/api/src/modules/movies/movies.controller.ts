import { Controller, Get, Param } from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { GetMovieRequestDto } from "./dto/requests/get-movie.request.dto";
import { MovieResponseDto } from "./dto/responses/movie.response.dto";
import { MoviesService } from "./movies.service";

@ApiTags("Movies")
@Controller("movies")
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get(":movieId")
  @ApiOperation({
    summary: "영화 상세 조회",
    description: "영화 제목·개봉일·미디어·외부 연결 정보를 조회",
  })
  @ApiOkResponse({
    type: MovieResponseDto,
    description: "영화 상세 정보 조회 성공",
  })
  @ApiNotFoundResponse({
    description: "영화를 찾을 수 없습니다.",
  })
  findById(@Param() params: GetMovieRequestDto) {
    return this.moviesService.findById(params.movieId);
  }
}
