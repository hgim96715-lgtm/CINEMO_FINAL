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
import { GetMovieRequestDto } from "./dto/requests/get-movie.request.dto";
import { KmdbMovieEnrichmentService } from "./kmdb-movie-enrichment.service";
import { KobisMovieImportService } from "./kobis-movie-import.service";
import { TmdbMovieSyncService } from "./tmdb-movie-sync.service";
import { TmdbMovieBatchImportService } from "./tmdb-movie-batch-import.service";
import { GetTmdbMovieRequestDto } from "@/integrations/tmdb/dto/requests/get-tmdb-movie.request.dto";
import { ImportKobisMovieRequestDto } from "./dto/requests/import-kobis-movie.request.dto";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Movie Imports")
// @ApiCookieAuth("cinemo_session")
@Public()
@Controller("movie-imports")
export class MovieImportController {
  constructor(
    private readonly kobisMovieImportService: KobisMovieImportService,
    private readonly tmdbMovieBatchImportService: TmdbMovieBatchImportService,
    private readonly tmdbMovieSyncService: TmdbMovieSyncService,
    private readonly kmdbMovieEnrichmentService: KmdbMovieEnrichmentService,
  ) {}

  @Public()
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
  importFromKobis(
    @Param() params: GetKobisMovieInfoRequestDto,
    @Query() query: ImportKobisMovieRequestDto,
  ) {
    return this.kobisMovieImportService.importMovie(
      params.movieCd,
      undefined,
      undefined,
      { releaseDate: query.releaseDate },
    );
  }

  @Post("tmdb/:tmdbMovieId")
  @ApiOperation({
    summary: "TMDB 영화 단건 저장",
    description: "TMDB 검색 결과에서 선택한 영화를 CINEMO DB에 저장",
  })
  @ApiOkResponse({
    schema: {
      type: "string",
      example: "01a0f063-d740-7084-a1ea-ed5c020640bb",
    },
  })
  importFromTmdb(@Param() params: GetTmdbMovieRequestDto) {
    return this.tmdbMovieBatchImportService.importMovie(params.tmdbMovieId);
  }

  @Post("tmdb/:tmdbMovieId/enrich/kmdb")
  @ApiOperation({
    summary: "TMDB 영화 저장 및 KMDb 정보 자동 보완",
    description:
      "TMDB 영화 ID만 받아 CINEMO 영화 저장 후 제목·개봉연도로 KMDb 정보를 자동 보완",
  })
  @ApiConflictResponse({
    description: "KMDb에서 일치하는 후보가 여러 개 발견되어 수동 확인이 필요함",
  })
  @ApiOkResponse({
    schema: {
      type: "string",
      example: "01a0f063-d740-7084-a1ea-ed5c020640bb",
    },
  })
  async importFromTmdbAndEnrichFromKmdb(
    @Param() params: GetTmdbMovieRequestDto,
  ) {
    const movieId = await this.tmdbMovieBatchImportService.importMovie(
      params.tmdbMovieId,
    );

    await this.kmdbMovieEnrichmentService.enrichMovieByMovieId(movieId);

    return movieId;
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
  syncFromTmdb(@Param() params: EnrichTmdbMovieRequestDto) {
    return this.tmdbMovieSyncService.syncMovieFromTmdb(
      params.movieId,
      params.tmdbMovieId,
    );
  }

  @Post(":movieId/enrich/kmdb")
  @ApiOperation({
    summary: "KMDb 영화 정보 자동 보완",
    description: "CINEMO 영화 제목·개봉연도로 KMDb 영화를 찾아 자동 보완",
  })
  @ApiOkResponse({
    schema: {
      type: "string",
      example: "01a0f063-d740-7084-a1ea-ed5c020640bb",
    },
  })
  enrichFromKmdbAutomatically(@Param() params: GetMovieRequestDto) {
    return this.kmdbMovieEnrichmentService.enrichMovieByMovieId(params.movieId);
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

}
