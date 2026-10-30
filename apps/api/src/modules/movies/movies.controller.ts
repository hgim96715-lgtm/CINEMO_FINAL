import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { MovieResponseDto } from "./dto/responses/movie.response.dto";
import { MoviesService } from "./movies.service";
import { GetMovieRequestDto } from "./dto/requests/get-movie.request.dto";
import { SearchMoviesRequestDto } from "./dto/requests/search-movies.request.dto";
import { MovieSearchResponseDto } from "./dto/responses/movie-search.response.dto";
import { MovieSitemapResponseDto } from "./dto/responses/movie-sitemap.response.dto";
import { GetPopularMoviesRequestDto } from "./dto/requests/get-popular-movies.request.dto";
import { GetUpcomingMoviesRequestDto } from "./dto/requests/get-upcoming-movies.request.dto";
import { Public } from "../auth/decorators/public.decorator";
import { UserMovieRecordService } from "./user-movie-record.service";
import { UpdateMovieRecordRequestDto } from "../auth/dto/requests/update-movie-record.request.dto";
import { UserMovieRecordResponseDto } from "./dto/responses/user-movie-record.response.dto";
import type { SessionUser } from "../auth/types/session-user.type";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { GetReleasedMoviesRequestDto } from "./dto/requests/get-released-movies.request.dto";
import { UserMovieNotificationService } from "./user-movie-notification.service";
import { MovieCalendarDayResponseDto } from "@/modules/movies/dto/responses/movie-calendar.response.dto";
import { GetMovieCalendarRequestDto } from "@/modules/movies/dto/requests/get-movie-calendar.request.dto";
import { MovieGenreCountResponseDto } from "@/modules/movies/dto/responses/movie-genre-count.response.dto";
import { GetMovieGenreAnalyticsRequestDto } from "@/modules/movies/dto/requests/get-movie-genre-analytics.request.dto";
import { toMovieGenreDateRange } from "./mappers/movie-genre-analytics.mapper";
import { UnifiedSearchResponseDto } from "./dto/responses/unified-search.response.dto";

@ApiTags("Movies")
@Controller("movies")
export class MoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly userMovieRecordService: UserMovieRecordService,
    private readonly userMovieNotificationService: UserMovieNotificationService,
  ) {}

  @Public()
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Get("search/unified")
  @ApiOperation({
    summary: "CINEMO 통합 검색",
    description: "영화·인물·장르 검색 결과를 한 번에 반환",
  })
  @ApiOkResponse({
    type: UnifiedSearchResponseDto,
    description: "영화·인물·장르 통합 검색 결과",
  })
  unifiedSearch(@Query() params: SearchMoviesRequestDto) {
    return this.moviesService.unifiedSearch(
      params.query,
      params.page,
      params.limit,
    );
  }

  @ApiConflictResponse({
    description:
      "동일한 영화 후보가 여러 개 발견되어 관리자 검토가 필요합니다.",
    schema: {
      example: {
        statusCode: 409,
        code: "MOVIE_MATCH_REVIEW_REQUIRED",
        message: "동일한 영화 후보가 여러 개라 관리자 검토가 필요합니다.",
        candidateMovieIds: [
          "01a0f063-d740-7084-a1ea-ed5c020640bb",
          "0199b4f5-7c9d-7abc-8def-987654321def",
        ],
      },
    },
  })
  @Public()
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Get("search")
  @ApiOperation({
    summary: "CINEMO 영화 통합 검색",
    description:
      "제목·감독·배우·장르로 영화를 검색하고 페이지 단위 결과를 반환",
  })
  @ApiOkResponse({
    type: MovieSearchResponseDto,
    description: "영화 검색 결과와 페이지 정보",
  })
  search(@Query() params: SearchMoviesRequestDto) {
    return this.moviesService.search(params.query, params.page, params.limit);
  }

  @Public()
  @Get("sitemap")
  @ApiOperation({
    summary: "영화 sitemap 데이터 조회",
    description:
      "Web SEO sitemap 생성을 위해 영화의 CINEMO 내부 ID와 수정 시각을 조회",
  })
  @ApiOkResponse({
    type: MovieSitemapResponseDto,
    description: "sitemap 생성용 영화 목록",
  })
  getSitemapMovies() {
    return this.moviesService.getSitemapMovies();
  }

  @Public()
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Get("popular")
  @ApiOperation({
    summary: "DB에 저장된 인기 영화 조회",
    description: "TMDB 연결이 승인된 CINEMO 영화 목록을 조회",
  })
  @ApiOkResponse({
    type: MovieSearchResponseDto,
  })
  getPopularMovies(@Query() params: GetPopularMoviesRequestDto) {
    return this.moviesService.getPopularMovies(params.page, params.limit);
  }

  @Public()
  @Get("rankings")
  @ApiOperation({
    summary: "KOBIS 영화 순위 조회",
    description: "DB에 저장된 최신 KOBIS 박스오피스 순위 조회",
  })
  @ApiOkResponse({
    type: MovieSearchResponseDto,
  })
  getMovieRankings(@Query() params: GetPopularMoviesRequestDto) {
    return this.moviesService.getMovieRankings(params.page, params.limit);
  }

  @Public()
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Get("upcoming")
  @ApiOperation({
    summary: "개봉 예정 영화 조회",
    description: "CINEMO DB에 저장된 개봉 예정 영화를 조회",
  })
  @ApiOkResponse({
    type: MovieSearchResponseDto,
  })
  getUpcomingMovies(@Query() params: GetUpcomingMoviesRequestDto) {
    return this.moviesService.getUpcomingMovies(params);
  }

  @Public()
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Get("released")
  @ApiOperation({
    summary: "올해 개봉 영화 조회",
    description: "올해 개봉한 영화를 조회하며 yearMonth로 월별 필터링 가능",
  })
  @ApiOkResponse({
    type: MovieSearchResponseDto,
  })
  getReleasedMovies(@Query() params: GetReleasedMoviesRequestDto) {
    return this.moviesService.getReleasedMovies(params);
  }

  @Public()
  @Get("analytics/genres")
  @ApiOkResponse({
    type: [MovieGenreCountResponseDto],
    description: "기간별 장르별 개봉 영화 수",
  })
  getGenreAnalytics(@Query() query: GetMovieGenreAnalyticsRequestDto) {
    return this.moviesService.getGenreCountsByReleasePeriod(
      toMovieGenreDateRange(query),
    );
  }

  @ApiCookieAuth("cinemo_session")
  @Get("my/calendar")
  @ApiOperation({
    summary: "내 영화 관람 달력 조회",
    description: "특정 연도와 월에 관람한 영화를 날짜별로 조회",
  })
  @ApiOkResponse({
    type: [MovieCalendarDayResponseDto],
    description: "날짜별 관람 영화 목록",
  })
  getMyMovieCalendar(
    @Query() query: GetMovieCalendarRequestDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.userMovieRecordService.findCalendarByUser(
      user.id,
      query.year,
      query.month,
    );
  }

  @ApiCookieAuth("cinemo_session")
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Get("my")
  @ApiOperation({
    summary: "내 영화 목록 조회",
    description: "찜한 영화·본 영화·평점이 있는 영화 목록 조회",
  })
  async getMyMovies(@CurrentUser() user: SessionUser) {
    return this.userMovieRecordService.findAllByUser(user.id);
  }

  @ApiCookieAuth("cinemo_session")
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Get("notifications")
  @ApiOperation({
    summary: "내 영화 개봉 알림 목록 조회",
  })
  getMyMovieNotifications(@CurrentUser() user: SessionUser) {
    return this.userMovieNotificationService.findMyReleaseNotifications(
      user.id,
    );
  }

  @ApiCookieAuth("cinemo_session")
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Get(":movieId/record")
  @ApiOperation({
    summary: "사용자 영화 기록 조회",
    description: "찜하기·봤어요·개인 평점 상태 조회",
  })
  @ApiOkResponse({
    type: UserMovieRecordResponseDto,
    description: "사용자 영화 기록 조회 성공",
  })
  getMovieRecord(
    @Param() params: GetMovieRequestDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.userMovieRecordService.findByUserAndMovie(
      user.id,
      params.movieId,
    );
  }

  @ApiCookieAuth("cinemo_session")
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Get(":movieId/notification")
  @ApiOperation({
    summary: "영화 개봉 알림 상태 조회",
  })
  getMovieNotification(
    @Param() params: GetMovieRequestDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.userMovieNotificationService.findStatus(
      user.id,
      params.movieId,
    );
  }

  @ApiCookieAuth("cinemo_session")
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Post(":movieId/notification")
  @ApiOperation({
    summary: "영화 개봉 알림 신청",
  })
  subscribeMovieNotification(
    @Param() params: GetMovieRequestDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.userMovieNotificationService.subscribe(user.id, params.movieId);
  }

  @ApiCookieAuth("cinemo_session")
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Delete(":movieId/notification")
  @ApiOperation({
    summary: "영화 개봉 알림 해제",
  })
  unsubscribeMovieNotification(
    @Param() params: GetMovieRequestDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.userMovieNotificationService.unsubscribe(
      user.id,
      params.movieId,
    );
  }

  @ApiCookieAuth("cinemo_session")
  @Throttle({
    default: {
      limit: 30,
      ttl: 60_000,
    },
  })
  @Patch(":movieId/record")
  @ApiOperation({
    summary: "사용자 영화 기록 수정",
    description: "찜하기·봤어요·개인 평점 상태를 수정",
  })
  @ApiOkResponse({
    type: UserMovieRecordResponseDto,
    description: "사용자 영화 기록 수정 성공",
  })
  updateMovieRecord(
    @Param() params: GetMovieRequestDto,
    @Body() input: UpdateMovieRecordRequestDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.userMovieRecordService.upsert(user.id, params.movieId, input);
  }

  @Public()
  @Throttle({
    default: {
      limit: 300,
      ttl: 60_000,
    },
  })
  @Get(":movieId")
  @ApiOperation({
    summary: "영화 상세 조회",
    description: "영화 제목·개봉일·미디어·외부 연결 정보를 조회",
  })
  @ApiOkResponse({
    type: MovieResponseDto,
    description: "영화 상세 정보 조회 성공",
  })
  @ApiNotFoundResponse({
    description: "영화를 찾을 수 없습니다.",
  })
  findById(@Param() params: GetMovieRequestDto) {
    return this.moviesService.findById(params.movieId);
  }

  @Delete(":movieId/record")
  @ApiOperation({
    summary: "사용자 영화 기록 삭제",
    description: "찜·관람일·평점·관람 장소를 포함한 사용자 영화 기록을 삭제",
  })
  @ApiOkResponse({
    description: "사용자 영화 기록 삭제 성공",
  })
  deleteMovieRecord(
    @Param() params: GetMovieRequestDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.userMovieRecordService.delete(user.id, params.movieId);
  }
}
