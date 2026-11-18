import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CinemaShowtimeItemResponseDto {
  @ApiProperty({ example: "CGV" })
  chain!: "CGV" | "LOTTE_CINEMA" | "MEGABOX";

  @ApiProperty({ example: "CGV 강남" })
  theaterName!: string;

  @ApiProperty({ example: "서울 강남구 강남대로 438" })
  address!: string | null;

  @ApiProperty({ example: 0.3, description: "현재 위치에서 거리(km)" })
  distanceKm!: number;

  @ApiProperty({ example: "2026-11-17T14:20:00+09:00" })
  startsAt!: string;

  @ApiPropertyOptional({ example: "2026-11-17T16:55:00+09:00" })
  endsAt!: string | null;

  @ApiPropertyOptional({ example: "3관" })
  screenName!: string | null;

  @ApiPropertyOptional({ example: 42 })
  remainingSeats!: number | null;

  @ApiProperty({ example: "https://www.cgv.co.kr/cnm/movieBook" })
  bookingUrl!: string;
}

export class CinemaShowtimesResponseDto {
  @ApiProperty({ example: "듄" })
  movieTitle!: string;

  @ApiProperty({ example: "2026-11-17" })
  date!: string;

  @ApiProperty({ type: [CinemaShowtimeItemResponseDto] })
  items!: CinemaShowtimeItemResponseDto[];

  @ApiProperty({
    example: ["롯데시네마 상영시간표를 일시적으로 불러오지 못했습니다."],
  })
  unavailableChains!: string[];
}
