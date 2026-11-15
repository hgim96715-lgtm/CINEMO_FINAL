import { formatDailyMoviePush } from "@cinemo/shared/daily-movie-push";
import { Body, Controller, Delete, Get, HttpCode, Patch, Post } from "@nestjs/common";

import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import { OptionalAuth } from "@/modules/auth/decorators/optional-auth.decorator";
import type { SessionUser } from "@/modules/auth/types/session-user.type";

import { UpdateDailyMoviePreferenceRequestDto } from "../dto/requests/update-daily-movie-preference.request.dto";
import { WeatherRegionRequestDto } from "../dto/requests/weather-region.request.dto";
import { DailyMoviesService } from "../services/daily-movies.service";

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
  setWeatherRegion(@CurrentUser() user: SessionUser, @Body() input: WeatherRegionRequestDto) {
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
  setPreference(@CurrentUser() user: SessionUser, @Body() input: UpdateDailyMoviePreferenceRequestDto) {
    return this.dailyMovies.setPreference(user.id, input.enabled, input.pushTokenId);
  }

  @Post("visit")
  @HttpCode(204)
  async visit(@CurrentUser() user: SessionUser) {
    await this.dailyMovies.visit(user.id);
  }
}
