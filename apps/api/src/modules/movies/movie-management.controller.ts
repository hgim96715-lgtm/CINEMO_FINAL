import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { GetMovieRequestDto } from "./dto/requests/get-movie.request.dto";
import { GetMovieModerationRequestDto } from "./dto/requests/get-movie-moderation.request.dto";
import { UpdateMovieVisibilityRequestDto } from "./dto/requests/update-movie-visibility.request.dto";
import { MoviesService } from "./movies.service";
import { KobisMovieBatchImportService } from "./kobis-movie-batch-import.service";

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
}
