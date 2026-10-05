// apps/api/src/modules/movies/movies.controller.ts

import { Controller, Get, Param, Post, Query } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { MovieResponseDto } from "./dto/responses/movie.response.dto";
import { MoviesService } from "./movies.service";
import { GetMovieRequestDto } from "./dto/requests/get-movie.request.dto";
import { SearchMoviesRequestDto } from "./dto/requests/search-movies.request.dto";
import { MovieSearchResponseDto } from "./dto/responses/movie-search.response.dto";
import { MovieSitemapResponseDto } from "./dto/responses/movie-sitemap.response.dto";
import { GetPopularMoviesRequestDto } from "./dto/requests/get-popular-movies.request.dto";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Movies")
@Controller("movies")
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @ApiConflictResponse({
    description:
      "동일한 영화 후보가 여러 개 발견되어 관리자 검토가 필요합니다.",
    schema: {
      example: {
        statusCode: 409,
        code: "MOVIE_MATCH_REVIEW_REQUIRED",
        message: "동일한 영화 후보가 여러 개라 관리자 검토가 필요합니다.",
        candidateMovieIds: [
          "01a0f063-d740-7084-a1ea-ed5c020640bb",
          "0199b4f5-7c9d-7abc-8def-987654321def",
        ],
      },
    },
  })
  @Public()
  @Get("search")
  @ApiOperation({
    summary: "CINEMO 영화 통합 검색",
    description:
      "제목·감독·배우·장르로 영화를 검색하고 페이지 단위 결과를 반환",
  })
  @ApiOkResponse({
    type: MovieSearchResponseDto,
    description: "영화 검색 결과와 페이지 정보",
  })
  search(@Query() params: SearchMoviesRequestDto) {
    return this.moviesService.search(params.query, params.page, params.limit);
  }

  @Public()
  @Get("sitemap")
  @ApiOperation({
    summary: "영화 sitemap 데이터 조회",
    description:
      "Web SEO sitemap 생성을 위해 영화의 CINEMO 내부 ID와 수정 시각을 조회",
  })
  @ApiOkResponse({
    type: MovieSitemapResponseDto,
    description: "sitemap 생성용 영화 목록",
  })
  getSitemapMovies() {
    return this.moviesService.getSitemapMovies();
  }

  @Public()
  @Get("popular")
  @ApiOperation({
    summary: "DB에 저장된 인기 영화 조회",
    description: "TMDB 연결이 승인된 CINEMO 영화 목록을 조회",
  })
  @ApiOkResponse({
    type: MovieSearchResponseDto,
  })
  getPopularMovies(@Query() params: GetPopularMoviesRequestDto) {
    return this.moviesService.getPopularMovies(params.page, params.limit);
  }

  @Public()
  @Get("rankings")
  @ApiOperation({
    summary: "KOBIS 영화 순위 조회",
    description: "DB에 저장된 최신 KOBIS 박스오피스 순위 조회",
  })
  @ApiOkResponse({
    type: MovieSearchResponseDto,
  })
  getMovieRankings(@Query() params: GetPopularMoviesRequestDto) {
    return this.moviesService.getMovieRankings(params.page, params.limit);
  }

  @Public()
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
