import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { AdminGuard } from "../auth/admin.guard";

import { GetMovieRequestDto } from "./dto/requests/get-movie.request.dto";
import { GetMovieModerationRequestDto } from "./dto/requests/get-movie-moderation.request.dto";
import { UpdateMovieVisibilityRequestDto } from "./dto/requests/update-movie-visibility.request.dto";
import { MoviesService } from "./movies.service";

@ApiTags("Admin Movies")
@ApiCookieAuth("cinemo_session")
@UseGuards(AdminGuard)
@Controller("admin/movies")
export class MovieModerationController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get("moderation")
  @ApiOperation({ summary: "영화 검토 목록 조회" })
  getModerationMovies(@Query() query: GetMovieModerationRequestDto) {
    return this.moviesService.getModerationMovies(query);
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
