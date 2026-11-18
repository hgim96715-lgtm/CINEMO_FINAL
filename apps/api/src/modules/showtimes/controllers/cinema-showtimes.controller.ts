import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { Public } from "@/modules/auth/decorators/public.decorator";
import { GetCinemaShowtimesRequestDto } from "../dto/requests/get-cinema-showtimes.request.dto";
import { CinemaShowtimesResponseDto } from "../dto/responses/cinema-showtimes.response.dto";
import { CinemaShowtimesService } from "../services/cinema-showtimes.service";

@ApiTags("Cinema Showtimes")
@Controller("cinema-showtimes")
export class CinemaShowtimesController {
  constructor(private readonly cinemaShowtimesService: CinemaShowtimesService) {}

  @Public()
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  @Get()
  @ApiOperation({
    summary: "내 위치에서 가장 가까운 체인 영화관의 상영시간표 조회",
    description:
      "CGV·롯데시네마·메가박스 공식 코드가 연결된 가까운 극장만 조회하며, 예매·로그인·좌석 맵에는 접근하지 않습니다.",
  })
  @ApiOkResponse({ type: CinemaShowtimesResponseDto })
  getNearbyShowtimes(@Query() query: GetCinemaShowtimesRequestDto) {
    return this.cinemaShowtimesService.getNearbyShowtimes(query);
  }
}
