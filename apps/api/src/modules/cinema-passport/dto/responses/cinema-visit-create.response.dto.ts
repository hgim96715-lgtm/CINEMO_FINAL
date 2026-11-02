import { ApiProperty } from "@nestjs/swagger";
import { CinemaVisitResponseDto } from "./cinema-visit.response.dto";
import { CinemaVisitStampResponseDto } from "./cinema-visit-stamp.response.dto";

export class CinemaVisitCreateResponseDto {
  @ApiProperty({
    description: "생성된 영화관 방문 기록",
    type: CinemaVisitResponseDto,
  })
  visit!: CinemaVisitResponseDto;

  @ApiProperty({
    description: "영화관 스탬프 정보",
    type: CinemaVisitStampResponseDto,
  })
  stamp!: CinemaVisitStampResponseDto;
}
