import { Controller, Param, Post, Query } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { GetKobisMovieInfoRequestDto } from "@/integrations/kobis/dto/requests/get-kobis-movie-info.request.dto";

import { EnrichKmdbMovieRequestDto } from "./dto/requests/enrich-kmdb-movie.request.dto";
import { EnrichTmdbMovieRequestDto } from "./dto/requests/enrich-tmdb-movie.request.dto";
import { KmdbMovieEnrichmentService } from "./kmdb-movie-enrichment.service";
import { KobisMovieImportService } from "./kobis-movie-import.service";
import { TmdbMovieBatchImportService } from "./tmdb-movie-batch-import.service";
import { TmdbMovieEnrichmentService } from "./tmdb-movie-enrichment.service";
import { ImportKobisMoviesRequestDto } from "./dto/requests/import-kobis-movies.request.dto";
import { KobisMovieBatchImportService } from "./kobis-movie-batch-import.service";

@ApiTags("Movie Imports")
@Controller("movie-imports")
export class MovieImportController {
  constructor(
    private readonly kobisMovieImportService: KobisMovieImportService,
    private readonly kobisMovieBatchImportService: KobisMovieBatchImportService,
    private readonly tmdbMovieBatchImportService: TmdbMovieBatchImportService,
    private readonly tmdbMovieEnrichmentService: TmdbMovieEnrichmentService,
    private readonly kmdbMovieEnrichmentService: KmdbMovieEnrichmentService,
  ) {}

  @Post("kobis/:movieCd")
  @ApiOperation({
    summary: "KOBIS 영화 저장",
    description: "KOBIS 영화 정보를 CINEMO DB에 저장하거나 기존 영화와 연결",
  })
  @ApiConflictResponse({
    description: "동일한 영화 후보가 여러 개 발견됨",
  })
  @ApiBadRequestResponse({
    description: "KOBIS 영화 코드가 올바르지 않음",
  })
  @ApiOkResponse({
    schema: {
      type: "string",
      example: "01a0f063-d740-7084-a1ea-ed5c020640bb",
    },
  })
  importFromKobis(@Param() params: GetKobisMovieInfoRequestDto) {
    return this.kobisMovieImportService.importMovie(params.movieCd);
  }

  @Post("tmdb/popular")
  @ApiOperation({
    summary: "TMDB 인기 영화 일괄 저장",
    description: "TMDB 인기 영화 2페이지를 조회해 CINEMO DB에 저장",
  })
  @ApiOkResponse({
    schema: {
      type: "array",
      items: {
        type: "string",
      },
    },
  })
  importPopularFromTmdb() {
    return this.tmdbMovieBatchImportService.importPopularMovies(2);
  }

  @Post("tmdb/now-playing")
  @ApiOperation({
    summary: "TMDB 현재 상영 영화 일괄 저장",
    description: "TMDB 현재 상영 중인 영화 2페이지를 조회해 CINEMO DB에 저장",
  })
  @ApiOkResponse({
    schema: {
      type: "array",
      items: {
        type: "string",
      },
    },
  })
  importNowPlayingFromTmdb() {
    return this.tmdbMovieBatchImportService.importNowPlayingMovies(2);
  }

  @Post(":movieId/enrich/tmdb/:tmdbMovieId")
  @ApiOperation({
    summary: "TMDB 영화 정보 보완",
    description: "기존 영화에 TMDB 상세 정보와 인물·미디어 정보를 보완",
  })
  @ApiOkResponse({
    schema: {
      type: "string",
      example: "01a0f063-d740-7084-a1ea-ed5c020640bb",
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
    description: "기존 영화에 KMDb 상세 정보와 개봉·포스터 정보를 보완",
  })
  @ApiOkResponse({
    schema: {
      type: "string",
      example: "01a0f063-d740-7084-a1ea-ed5c020640bb",
    },
  })
  enrichFromKmdb(@Param() params: EnrichKmdbMovieRequestDto) {
    return this.kmdbMovieEnrichmentService.enrichMovie(
      params.movieId,
      params.docId,
    );
  }

  @Post("kobis")
  @ApiOperation({
    summary: "KOBIS 영화 일괄 저장",
    description:
      "제작 연도 범위 기준으로 KOBIS 영화 목록을 여러 페이지 조회해 저장",
  })
  @ApiOkResponse({
    schema: {
      type: "array",
      items: {
        type: "string",
      },
    },
  })
  importMoviesFromKobis(@Query() params: ImportKobisMoviesRequestDto) {
    return this.kobisMovieBatchImportService.importMovies(
      params.productionStartYear,
      params.productionEndYear,
      params.pageCount,
      params.limit,
    );
  }
}
