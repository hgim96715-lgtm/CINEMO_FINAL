import { ApiProperty } from "@nestjs/swagger";

export class CinemaVisitStampResponseDto {
  @ApiProperty({
    description: "영화관 ID",
    type: String,
    format: "uuid",
  })
  venueId!: string;

  @ApiProperty({
    description: "영화관 방문 횟수",
    type: Number,
    example: 2,
  })
  visitCount!: number;

  @ApiProperty({
    description: "첫 방문 일시",
    type: String,
    format: "date-time",
  })
  firstVisitedAt!: string;

  @ApiProperty({
    description: "최근 방문 일시",
    type: String,
    format: "date-time",
  })
  lastVisitedAt!: string;
}
