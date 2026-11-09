import { formatDailyMoviePush } from "@cinemo/shared/daily-movie-push";
import { Body, Controller, Delete, Get, HttpCode, Patch, Post } from "@nestjs/common";
import { IsBoolean, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

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

class WeatherRegionDto {
  @IsInt()
  @Min(1)
  @Max(149)
  nx!: number;

  @IsInt()
  @Min(1)
  @Max(253)
  ny!: number;
}

@Controller("daily-movie")
export class DailyMoviesController {
  constructor(private readonly dailyMovies: DailyMoviesService) {}

  @OptionalAuth()
  @Get()
  today(@CurrentUser() user?: SessionUser) {
    return this.dailyMovies.today(user?.id);
  }

  @Get("push-preview")
  async pushPreview(@CurrentUser() user: SessionUser) {
    const [settings, pick] = await Promise.all([
      this.dailyMovies.pushSettings(),
      this.dailyMovies.today(user.id),
    ]);
    return {
      enabled: settings.enabled,
      weekdays: settings.weekdays,
      hour: settings.hour,
      movieId: pick?.movie.id ?? null,
      ...formatDailyMoviePush(settings, pick?.movie.title ?? "오늘 추천할 영화", pick?.reason ?? "관람 기록이 없는 작품에서 골랐어요.", pick?.headline),
    };
  }

  @Get("weather-region")
  weatherRegion(@CurrentUser() user: SessionUser) {
    return this.dailyMovies.weatherRegion(user.id);
  }

  @Patch("weather-region")
  setWeatherRegion(@CurrentUser() user: SessionUser, @Body() input: WeatherRegionDto) {
    return this.dailyMovies.setWeatherRegion(user.id, input);
  }

  @Delete("weather-region")
  @HttpCode(204)
  async clearWeatherRegion(@CurrentUser() user: SessionUser) {
    await this.dailyMovies.setWeatherRegion(user.id, null);
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
