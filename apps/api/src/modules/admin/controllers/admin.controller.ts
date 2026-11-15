import { DailyMoviesService } from "@/modules/daily-movies/services/daily-movies.service";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { AdminGuard } from "../guards/admin.guard";
import { ServiceVisitsService } from "../services/service-visits.service";
import { ServiceEventsService } from "../services/service-events.service";
import { AdminService } from "../services/admin.service";
import { CreateCurationRequestDto } from "../dto/requests/create-curation.request.dto";
import { UpdateCurationRequestDto } from "../dto/requests/update-curation.request.dto";
import { UpdateDailyMoviePushRequestDto } from "../dto/requests/update-daily-movie-push.request.dto";
import { CurationResponseDto } from "../dto/responses/curation.response.dto";

@ApiTags("Admin")
@ApiCookieAuth("cinemo_session")
@UseGuards(AdminGuard)
@Controller("admin")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly dailyMovies: DailyMoviesService,
    private readonly visits: ServiceVisitsService,
    private readonly events: ServiceEventsService,
  ) {}

  @Get("daily-movie-push")
  getDailyMoviePush() {
    return this.dailyMovies.pushSettings();
  }

  @Patch("daily-movie-push")
  updateDailyMoviePush(@Body() input: UpdateDailyMoviePushRequestDto) {
    return this.dailyMovies.updatePushSettings(input);
  }

  @Get("visits")
  @ApiOperation({ summary: "최근 7일 방문 통계" })
  findVisits() {
    return this.visits.summary();
  }

  @Get("conversions")
  @ApiOperation({ summary: "최근 7일 유입·전환 통계" })
  findConversions() {
    return this.events.summary();
  }

  @Get("users")
  @ApiOperation({ summary: "관리자용 회원·접속 현황 조회" })
  @ApiOkResponse({ description: "회원 목록과 접속 현황" })
  findUsers() {
    return this.adminService.findUsers();
  }

  @Get("users/:userId/activity")
  @ApiOperation({ summary: "관리자용 회원 활동 이력 조회" })
  @ApiOkResponse({ description: "최근 회원 활동 이력" })
  findUserActivity(@Param("userId", ParseUUIDPipe) userId: string) {
    return this.adminService.findUserActivity(userId);
  }

  @Get("curations")
  @ApiOperation({ summary: "관리자용 큐레이션 목록 조회" })
  @ApiOkResponse({ type: CurationResponseDto, isArray: true })
  findCurations() {
    return this.adminService.findCurations();
  }

  @Post("curations")
  @ApiOperation({ summary: "관리자용 큐레이션 생성" })
  @ApiOkResponse({ type: CurationResponseDto })
  createCuration(@Body() input: CreateCurationRequestDto) {
    return this.adminService.createCuration(input);
  }

  @Patch("curations/:curationId")
  @ApiOperation({ summary: "관리자용 큐레이션 수정" })
  @ApiOkResponse({ type: CurationResponseDto })
  updateCuration(
    @Param("curationId", ParseUUIDPipe) curationId: string,
    @Body() input: UpdateCurationRequestDto,
  ) {
    return this.adminService.updateCuration(curationId, input);
  }

  @Delete("curations/:curationId")
  @ApiOperation({ summary: "관리자용 큐레이션 삭제" })
  deleteCuration(@Param("curationId", ParseUUIDPipe) curationId: string) {
    return this.adminService.deleteCuration(curationId);
  }
}
