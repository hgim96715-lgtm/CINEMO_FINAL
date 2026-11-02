import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import type { SessionUser } from "@/modules/auth/types/session-user.type";
import { CreateCinemaVisitRequestDto } from "./dto/requests/create-cinema-visit.request.dto";
import { CinemaVisitCreateResponseDto } from "./dto/responses/cinema-visit-create.response.dto";
import { CinemaVisitResponseDto } from "./dto/responses/cinema-visit.response.dto";
import { CinemaVisitService } from "./cinema-visit.service";

@ApiTags("Cinema Passport")
@Controller("cinema-passport/visits")
export class CinemaVisitController {
  constructor(private readonly cinemaVisitService: CinemaVisitService) {}

  @ApiCookieAuth("cinemo_session")
  @ApiOperation({
    summary: "영화관 방문 기록 생성",
    description: "영화관 방문 기록을 저장하고 스탬프 정보를 반환",
  })
  @ApiCreatedResponse({
    description: "영화관 방문 기록 생성 성공",
    type: CinemaVisitCreateResponseDto,
  })
  @Post()
  async create(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateCinemaVisitRequestDto,
  ) {
    return this.cinemaVisitService.create(user.id, dto);
  }

  @ApiCookieAuth("cinemo_session")
  @ApiOperation({
    summary: "내 영화관 방문 기록 조회",
    description: "로그인한 사용자의 영화관 방문 기록을 조회",
  })
  @ApiOkResponse({
    description: "영화관 방문 기록 목록",
    type: [CinemaVisitResponseDto],
  })
  @Get()
  async findAll(@CurrentUser() user: SessionUser) {
    return this.cinemaVisitService.findAllByUser(user.id);
  }

  @ApiCookieAuth("cinemo_session")
  @ApiOperation({
    summary: "영화관별 방문 기록 조회",
    description: "특정 영화관의 내 방문 기록을 조회",
  })
  @ApiOkResponse({
    description: "영화관별 방문 기록 목록",
    type: [CinemaVisitResponseDto],
  })
  @Get("venues/:venueId")
  async findAllByVenue(
    @CurrentUser() user: SessionUser,
    @Param("venueId", new ParseUUIDPipe()) venueId: string,
  ) {
    return this.cinemaVisitService.findAllByUserAndVenue(user.id, venueId);
  }

  @ApiCookieAuth("cinemo_session")
  @ApiOperation({
    summary: "영화관 방문 기록 삭제",
  })
  @ApiNoContentResponse({
    description: "영화관 방문 기록 삭제 성공",
  })
  @Delete(":visitId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: SessionUser,
    @Param("visitId", new ParseUUIDPipe()) visitId: string,
  ) {
    await this.cinemaVisitService.remove(user.id, visitId);
  }
}
