import { Body, Controller, Get, HttpCode, Patch, Post } from "@nestjs/common";
import { IsBoolean, IsOptional, IsUUID } from "class-validator";

import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import { OptionalAuth } from "@/modules/auth/decorators/optional-auth.decorator";
import type { SessionUser } from "@/modules/auth/types/session-user.type";
import { DailyMoviesService } from "./daily-movies.service";

class UpdateDailyMoviePreferenceDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsUUID()
  pushTokenId?: string;
}

@Controller("daily-movie")
export class DailyMoviesController {
  constructor(private readonly dailyMovies: DailyMoviesService) {}

  @OptionalAuth()
  @Get()
  today(@CurrentUser() user?: SessionUser) {
    return this.dailyMovies.today(user?.id);
  }

  @Get("preference")
  preference(@CurrentUser() user: SessionUser) {
    return this.dailyMovies.preference(user.id);
  }

  @Patch("preference")
  setPreference(@CurrentUser() user: SessionUser, @Body() input: UpdateDailyMoviePreferenceDto) {
    return this.dailyMovies.setPreference(user.id, input.enabled, input.pushTokenId);
  }

  @Post("visit")
  @HttpCode(204)
  async visit(@CurrentUser() user: SessionUser) {
    await this.dailyMovies.visit(user.id);
  }
}
