import { Controller, Get, Param, Query } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { GetTmdbMovieListRequestDto } from "./dto/requests/get-tmdb-movie-list.request.dto";
import { GetTmdbMovieRequestDto } from "./dto/requests/get-tmdb-movie.request.dto";
import { SearchTmdbPeopleRequestDto } from "./dto/requests/search-tmdb-people.request.dto";
import { SearchTmdbMoviesRequestDto } from "./dto/requests/search-tmdb-movies.request.dto";
import { TmdbMovieDetailResponseDto } from "./dto/responses/movie-detail.response.dto";
import { TmdbMovieGenreListResponseDto } from "./dto/responses/movie-genres.response.dto";
import { TmdbMovieListResponseDto } from "./dto/responses/movie-list.response.dto";
import {
  TmdbMovieVideoResponseDto,
  TmdbMovieVideosResponseDto,
} from "./dto/responses/movie-videos.response.dto";
import { SearchTmdbMoviesResponseDto } from "./dto/responses/search-tmdb-movies.response.dto";
import { SearchTmdbPeopleResponseDto } from "./dto/responses/search-tmdb-people.response.dto";
import { TmdbService } from "./tmdb.service";
import { Public } from "@/modules/auth/decorators/public.decorator";
import { TmdbPersonDetailResponseDto } from "./dto/responses/person-detail.response.dto";
import { GetTmdbPersonRequestDto } from "./dto/requests/get-tmdb-person.request.dto";

@ApiTags("TMDB")
@Controller("tmdb")
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Get("movies/search")
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @ApiOperation({ summary: "TMDB 영화 검색" })
  @ApiOkResponse({
    type: SearchTmdbMoviesResponseDto,
  })
  @Public()
  searchMovies(@Query() query: SearchTmdbMoviesRequestDto) {
    return this.tmdbService.searchMovies(query.query, query.page);
  }

  @Get("movies/upcoming")
  @ApiOperation({ summary: "개봉 예정 영화 조회" })
  @ApiOkResponse({
    type: TmdbMovieListResponseDto,
  })
  @Public()
  getUpcomingMovies(@Query() query: GetTmdbMovieListRequestDto) {
    return this.tmdbService.getUpcomingMovies(query.page);
  }

  @Get("movies/popular")
  @ApiOperation({ summary: "TMDB 인기 영화 조회" })
  @ApiOkResponse({
    type: TmdbMovieListResponseDto,
  })
  @Public()
  getPopularMovies(@Query() query: GetTmdbMovieListRequestDto) {
    return this.tmdbService.getPopularMovies(query.page);
  }

  @Get("movies/genres")
  @ApiOperation({ summary: "TMDB 영화 장르 목록 조회" })
  @ApiOkResponse({
    type: TmdbMovieGenreListResponseDto,
  })
  @Public()
  getMovieGenres() {
    return this.tmdbService.getMovieGenres();
  }

  @Get("movies/:tmdbMovieId/videos")
  @ApiOperation({ summary: "TMDB 영화 영상 조회" })
  @ApiOkResponse({
    type: TmdbMovieVideosResponseDto,
  })
  @Public()
  getMovieVideos(@Param() params: GetTmdbMovieRequestDto) {
    return this.tmdbService.getMovieVideos(params.tmdbMovieId);
  }

  @Get("movies/:tmdbMovieId/trailer")
  @ApiOperation({ summary: "TMDB 공식 예고편 조회" })
  @ApiOkResponse({
    type: TmdbMovieVideoResponseDto,
    nullable: true,
  })
  @Public()
  getOfficialTrailer(@Param() params: GetTmdbMovieRequestDto) {
    return this.tmdbService.getOfficialTrailer(params.tmdbMovieId);
  }

  @Get("movies/:tmdbMovieId")
  @ApiOperation({ summary: "TMDB 영화 상세 조회" })
  @ApiOkResponse({
    type: TmdbMovieDetailResponseDto,
  })
  @Public()
  getMovieDetail(@Param() params: GetTmdbMovieRequestDto) {
    return this.tmdbService.getMovieDetail(params.tmdbMovieId);
  }

  @Get("people/search")
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @ApiOperation({
    summary: "TMDB 인물 검색",
    description: "외부 인물 식별자를 모를 때 이름으로 TMDB 인물을 검색",
  })
  @ApiOkResponse({
    description: "TMDB 인물 검색 결과",
    type: SearchTmdbPeopleResponseDto,
  })
  @Public()
  searchPeople(
    @Query() query: SearchTmdbPeopleRequestDto,
  ) {
    return this.tmdbService.searchPeople(query.query, query.page);
  }

  @Get("people/:tmdbPersonId")
  @ApiOperation({
    summary: "TMDB 인물 상세 조회",
    description: "TMDB 외부 인물 식별자로 인물 정보를 조회",
  })
  @ApiOkResponse({
    type: TmdbPersonDetailResponseDto,
  })
  @Public()
  getPersonDetail(@Param() params: GetTmdbPersonRequestDto) {
    return this.tmdbService.getPersonDetail(params.tmdbPersonId);
  }
}
