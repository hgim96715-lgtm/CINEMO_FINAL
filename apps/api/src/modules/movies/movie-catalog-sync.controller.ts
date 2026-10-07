import { Controller, Post, Query } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { GetKobisDailyBoxOfficeRequestDto } from "@/integrations/kobis/dto/requests/get-kobis-daily-box-office.request.dto";

import { ImportKobisMoviesRequestDto } from "./dto/requests/import-kobis-movies.request.dto";
import { ImportKobisReleasedMoviesRequestDto } from "./dto/requests/import-kobis-released-movies.request.dto";
import { KobisMovieBatchImportService } from "./kobis-movie-batch-import.service";
import { TmdbMovieBatchImportService } from "./tmdb-movie-batch-import.service";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Movie Catalog Sync")
@ApiCookieAuth("cinemo_session")
@Public()
@Controller("catalog-sync")
export class MovieCatalogSyncController {
  constructor(
    private readonly kobisMovieBatchImportService: KobisMovieBatchImportService,
    private readonly tmdbMovieBatchImportService: TmdbMovieBatchImportService,
  ) {}

  @Post("kobis/box-office")
  @ApiOperation({
    summary: "KOBIS 일별 박스오피스 동기화",
    description: "KOBIS 박스오피스와 순위 스냅샷을 저장",
  })
  @ApiOkResponse({ schema: { type: "array", items: { type: "string" } } })
  syncDailyBoxOffice(@Query() query: GetKobisDailyBoxOfficeRequestDto) {
    return this.kobisMovieBatchImportService.importDailyBoxOffice(
      query.targetDt,
    );
  }

  @Post("kobis/released")
  @ApiOperation({
    summary: "KOBIS 개봉 영화 일괄 동기화",
    description: "지정한 연도에 개봉한 영화를 저장",
  })
  syncReleasedMovies(@Query() query: ImportKobisReleasedMoviesRequestDto) {
    return this.kobisMovieBatchImportService.importReleasedMovies(
      query.releaseYear,
      query.limit,
    );
  }

  @Post("kobis/upcoming")
  @ApiOperation({
    summary: "KOBIS 개봉 예정 영화 동기화",
    description: "오늘 이후 개봉 예정 영화를 저장",
  })
  @ApiOkResponse({ schema: { type: "array", items: { type: "string" } } })
  syncUpcomingMovies() {
    return this.kobisMovieBatchImportService.importUpcomingMovies();
  }

  @Post("kobis")
  @ApiOperation({
    summary: "KOBIS 제작 연도 범위 일괄 동기화",
    description: "제작 연도 범위의 KOBIS 영화 목록을 저장",
  })
  @ApiOkResponse({ schema: { type: "array", items: { type: "string" } } })
  syncMoviesFromKobis(@Query() query: ImportKobisMoviesRequestDto) {
    return this.kobisMovieBatchImportService.importMovies(
      query.productionStartYear,
      query.productionEndYear,
      query.pageCount,
      query.limit,
    );
  }

  @Post("tmdb/popular")
  @ApiOperation({ summary: "TMDB 인기 영화 동기화" })
  @ApiOkResponse({ schema: { type: "array", items: { type: "string" } } })
  syncPopularMoviesFromTmdb() {
    return this.tmdbMovieBatchImportService.importPopularMovies(10);
  }

  @Post("tmdb/upcoming")
  @ApiOperation({ summary: "TMDB 개봉 예정 영화 동기화" })
  @ApiOkResponse({ schema: { type: "array", items: { type: "string" } } })
  syncUpcomingMoviesFromTmdb() {
    return this.tmdbMovieBatchImportService.importUpcomingMovies(10);
  }

  @Post("kobis/reconcile-releases")
  @ApiOperation({ summary: "KOBIS 개봉일 정합성 보정" })
  reconcileReleases() {
    return this.kobisMovieBatchImportService.reconcileKobisReleases();
  }

  @Post("kobis/audit-provider-collisions")
  @ApiOperation({ summary: "KOBIS·TMDB 연결 충돌 점검" })
  auditProviderCollisions() {
    return this.kobisMovieBatchImportService.auditProviderCollisions();
  }

  @Post("kobis/split-provider-collisions")
  @ApiOperation({ summary: "KOBIS·TMDB 연결 충돌 분리" })
  splitProviderCollisions() {
    return this.kobisMovieBatchImportService.splitProviderCollisions();
  }
}
