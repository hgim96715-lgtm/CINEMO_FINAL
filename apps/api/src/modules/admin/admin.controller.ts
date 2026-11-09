import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsBoolean, IsInt, IsString, Max, MaxLength, Min } from "class-validator";
import { DailyMoviesService } from "@/modules/daily-movies/daily-movies.service";
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

import { ServiceVisitsService } from "./service-visits.service";
import { AdminGuard } from "./admin.guard";
import { AdminService } from "./admin.service";
import { CreateCurationRequestDto } from "./dto/requests/create-curation.request.dto";
import { UpdateCurationRequestDto } from "./dto/requests/update-curation.request.dto";
import { CurationResponseDto } from "./dto/responses/curation.response.dto";

class UpdateDailyMoviePushDto {
  @IsBoolean()
  enabled!: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays!: number[];

  @IsInt()
  @Min(0)
  @Max(23)
  hour!: number;

  @IsString()
  @MaxLength(60)
  title!: string;

  @IsString()
  @MaxLength(180)
  body!: string;
}

@ApiTags("Admin")
@ApiCookieAuth("cinemo_session")
@UseGuards(AdminGuard)
@Controller("admin")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly dailyMovies: DailyMoviesService,
    private readonly visits: ServiceVisitsService,
  ) {}

  @Get("daily-movie-push")
  getDailyMoviePush() {
    return this.dailyMovies.pushSettings();
  }

  @Patch("daily-movie-push")
  updateDailyMoviePush(@Body() input: UpdateDailyMoviePushDto) {
    return this.dailyMovies.updatePushSettings(input);
  }

  @Get("visits")
  @ApiOperation({ summary: "최근 7일 방문 통계" })
  findVisits() {
    return this.visits.summary();
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
