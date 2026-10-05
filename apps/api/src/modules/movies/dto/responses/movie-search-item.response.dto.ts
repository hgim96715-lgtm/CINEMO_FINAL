import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class MovieSearchItemResponseDto {
  @ApiProperty({
    description: "CINEMO 내부 영화 UUID",
    example: "01a0f063-d740-7084-a1ea-ed5c020640bb",
  })
  id!: string;

  @ApiProperty({
    description: "대표 영화 제목",
    example: "어벤져스: 엔드게임 앙코르",
  })
  title!: string;

  @ApiProperty({
    type: String,
    description: "대표 개봉일",
    example: "2026-09-23",
    nullable: true,
  })
  releaseDate!: string | null;

  @ApiProperty({
    type: String,
    description: "대표 세로 포스터 주소",
    example: "https://image.tmdb.org/t/p/w500/poster.jpg",
    nullable: true,
  })
  posterUrl!: string | null;

  @ApiProperty({
    description: "영화 장르 목록",
    example: ["액션", "SF"],
    type: [String],
  })
  genres!: string[];

  @ApiProperty({
    type: Number,
    description: "KOBIS 박스오피스 순위",
    example: 1,
    nullable: true,
  })
  rank!: number | null;

  @ApiProperty({
    type: Number,
    description: "전일 대비 순위 변동. 양수는 상승, 음수는 하락",
    example: 2,
    nullable: true,
  })
  rankChange!: number | null;

  @ApiProperty({
    type: Number,
    description: "해당 날짜의 관객수",
    example: 12500,
    nullable: true,
  })
  audienceCount!: number | null;

  @ApiProperty({
    type: Number,
    description: "누적 관객수",
    example: 13900000,
    nullable: true,
  })
  totalAudienceCount!: number | null;

  @ApiProperty({
    description: "공식 예고편 존재 여부",
    example: true,
  })
  hasTrailer!: boolean;

  @ApiProperty({
    description: "청소년관람불가 영화 여부",
    example: false,
  })
  isAdultOnly!: boolean;
}
