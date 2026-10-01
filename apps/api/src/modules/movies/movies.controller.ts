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

import { GetKobisMovieInfoRequestDto } from "@/integrations/kobis/dto/requests/get-kobis-movie-info.request.dto";

import { MovieResponseDto } from "./dto/responses/movie.response.dto";
import { KobisMovieImportService } from "./kobis-movie-import.service";
import { MoviesService } from "./movies.service";
import { GetMovieRequestDto } from "./dto/requests/get-movie.request.dto";
import { EnrichTmdbMovieRequestDto } from "./dto/requests/enrich-tmdb-movie.request.dto";
import { TmdbMovieEnrichmentService } from "./tmdb-movie-enrichment.service";
import { KmdbMovieEnrichmentService } from "./kmdb-movie-enrichment.service";
import { EnrichKmdbMovieRequestDto } from "./dto/requests/enrich-kmdb-movie.request.dto";
import { SearchMoviesRequestDto } from "./dto/requests/search-movies.request.dto";
import { MovieSearchResponseDto } from "./dto/responses/movie-search.response.dto";
import { MovieSitemapResponseDto } from "./dto/responses/movie-sitemap.response.dto";

@ApiTags("Movies")
@Controller("movies")
export class MoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly kobisMovieImportService: KobisMovieImportService,
    private readonly tmdbMovieEnrichmentService: TmdbMovieEnrichmentService,
    private readonly kmdbMovieEnrichmentService: KmdbMovieEnrichmentService,
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
          "01a0f063-d740-7084-a1ea-ed5c020640bb",
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
      example: "01a0f063-d740-7084-a1ea-ed5c020640bb",
    },
    description: "저장되거나 연결된 CINEMO 내부 영화 UUID",
  })
  @ApiBadRequestResponse({
    description: "KOBIS 영화 코드가 올바르지 않습니다.",
  })
  importMovie(@Param() params: GetKobisMovieInfoRequestDto) {
    return this.kobisMovieImportService.importMovie(params.movieCd);
  }

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
  @Post(":movieId/enrich/kmdb/:docId")
  @ApiOperation({
    summary: "KMDb 영화 정보 보완",
    description: "기존 CINEMO 영화에 KMDb 제목·재개봉·포스터·상세 정보를 보완",
  })
  @ApiOkResponse({
    schema: {
      type: "string",
      example: "0199b4f5-7c9d-7abc-8def-123456789abc",
    },
  })
  enrichFromKmdb(@Param() params: EnrichKmdbMovieRequestDto) {
    return this.kmdbMovieEnrichmentService.enrichMovie(
      params.movieId,
      params.docId,
    );
  }
}
