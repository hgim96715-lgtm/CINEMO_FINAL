// apps/api/src/modules/movies/movies.controller.ts

import { Controller, Get, Param, Post } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { GetKobisMovieInfoRequestDto } from "@/integrations/kobis/dto/requests/get-kobis-movie-info.request.dto";

import { MovieResponseDto } from "./dto/responses/movie.response.dto";
import { KobisMovieImportService } from "./kobis-movie-import.service";
import { MoviesService } from "./movies.service";
import { GetMovieRequestDto } from "./dto/requests/get-movie.request.dto";
import { EnrichTmdbMovieRequestDto } from "./dto/requests/enrich-tmdb-movie.request.dto";
import { TmdbMovieEnrichmentService } from "./tmdb-movie-enrichment.service";

@ApiTags("Movies")
@Controller("movies")
export class MoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly kobisMovieImportService: KobisMovieImportService,
    private readonly tmdbMovieEnrichmentService: TmdbMovieEnrichmentService,
  ) {}

  @ApiConflictResponse({
    description:
      "동일한 영화 후보가 여러 개 발견되어 관리자 검토가 필요합니다.",
    schema: {
      example: {
        statusCode: 409,
        code: "MOVIE_MATCH_REVIEW_REQUIRED",
        message: "동일한 영화 후보가 여러 개라 관리자 검토가 필요합니다.",
        candidateMovieIds: [
          "0199b4f5-7c9d-7abc-8def-123456789abc",
          "0199b4f5-7c9d-7abc-8def-987654321def",
        ],
      },
    },
  })
  @Post("import/kobis/:movieCd")
  @ApiOperation({
    summary: "KOBIS 영화 DB 저장",
    description:
      "KOBIS 영화 정보를 조회하고, 기존 영화와 매칭한 뒤 CINEMO DB에 저장",
  })
  @ApiOkResponse({
    schema: {
      type: "string",
      example: "0199b4f5-7c9d-7abc-8def-123456789abc",
    },
    description: "저장되거나 연결된 CINEMO 내부 영화 UUID",
  })
  @ApiBadRequestResponse({
    description: "KOBIS 영화 코드가 올바르지 않습니다.",
  })
  importMovie(@Param() params: GetKobisMovieInfoRequestDto) {
    return this.kobisMovieImportService.importMovie(params.movieCd);
  }

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

  @Post(":movieId/enrich/tmdb/:tmdbMovieId")
  @ApiOperation({
    summary: "TMDB 영화 정보 보완",
    description: "기존 CINEMO 영화에 TMDB 포스터·배경·장르·예고편 정보를 보완",
  })
  @ApiOkResponse({
    schema: {
      type: "string",
      example: "0199b4f5-7c9d-7abc-8def-123456789abc",
    },
  })
  enrichFromTmdb(@Param() params: EnrichTmdbMovieRequestDto) {
    return this.tmdbMovieEnrichmentService.enrichMovie(
      params.movieId,
      params.tmdbMovieId,
    );
  }
}
