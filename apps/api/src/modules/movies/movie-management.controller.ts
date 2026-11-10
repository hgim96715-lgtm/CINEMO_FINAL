import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { GetMovieRequestDto } from "./dto/requests/get-movie.request.dto";
import { GetMovieModerationRequestDto } from "./dto/requests/get-movie-moderation.request.dto";
import { UpdateMovieVisibilityRequestDto } from "./dto/requests/update-movie-visibility.request.dto";
import { CreateManualRereleaseRequestDto } from "./dto/requests/create-manual-rerelease.request.dto";
import { UpdateManualRereleaseFormatRequestDto } from "./dto/requests/update-manual-rerelease-format.request.dto";
import { MoviesService } from "./movies.service";
import { KobisMovieBatchImportService } from "./kobis-movie-batch-import.service";
import { Public } from "../auth/decorators/public.decorator";
import { AdminGuard } from "../admin/admin.guard";

@ApiTags("Admin Movies")
// @ApiCookieAuth("cinemo_session")
@Controller("admin/movies")
export class MovieManagementController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly kobisMovieBatchImportService: KobisMovieBatchImportService,
  ) {}

  @Get("moderation")
  @ApiOperation({ summary: "영화 검토 목록 조회" })
  getModerationMovies(@Query() query: GetMovieModerationRequestDto) {
    return this.moviesService.getModerationMovies(query);
  }

  @Get("duplicates")
  @ApiOperation({
    summary: "중복 영화 후보 조회",
    description:
      "동일 제목·동일 최초 개봉연도의 영화만 조회하며, 데이터는 변경하지 않음",
  })
  getDuplicateMovieCandidates() {
    return this.moviesService.getDuplicateMovieCandidates();
  }

  @Post(":movieId/split-provider/:tmdbMovieId")
  @Public()
  @ApiOperation({
    summary: "KOBIS·TMDB 연결 충돌 단건 분리",
    description:
      "기존 영화를 KOBIS 영화로 유지하고 TMDB 영화 데이터를 새 영화로 분리함",
  })
  splitProviderCollision(
    @Param("movieId") movieId: string,
    @Param("tmdbMovieId") tmdbMovieId: string,
  ) {
    return this.kobisMovieBatchImportService.splitProviderCollision(
      movieId,
      tmdbMovieId,
    );
  }

  @Patch(":movieId/visibility")
  @ApiOperation({ summary: "영화 공개 상태 변경" })
  updateVisibility(
    @Param() params: GetMovieRequestDto,
    @Body() body: UpdateMovieVisibilityRequestDto,
  ) {
    return this.moviesService.updateMovieVisibility(
      params.movieId,
      body.visibility,
      body.moderationReason,
    );
  }

  @Post(":movieId/rereleases")
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: "관리자 직접 재개봉일 등록",
    description:
      "KOBIS·KMDB에 아직 없는 국내 재개봉일을 직접 등록하고 대표 개봉일로 설정함",
  })
  addManualRerelease(
    @Param() params: GetMovieRequestDto,
    @Body() body: CreateManualRereleaseRequestDto,
  ) {
    return this.moviesService.addManualRerelease(
      params.movieId,
      body.releaseDate,
    );
  }

  @Patch(":movieId/rereleases/format")
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: "관리자 직접 재개봉 개봉 형태 변경",
    description: "등록된 국내 재개봉의 개봉 형태만 변경하며 재개봉일은 유지함",
  })
  updateManualRereleaseFormat(
    @Param() params: GetMovieRequestDto,
    @Body() body: UpdateManualRereleaseFormatRequestDto,
  ) {
    return this.moviesService.updateManualRereleaseFormat(
      params.movieId,
      body.theaterExclusive,
    );
  }
}
