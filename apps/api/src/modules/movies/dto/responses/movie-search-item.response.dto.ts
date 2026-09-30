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

  @ApiPropertyOptional({
    description: "대표 개봉일",
    example: "2026-09-23",
    nullable: true,
  })
  releaseDate!: string | null;

  @ApiPropertyOptional({
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
}
