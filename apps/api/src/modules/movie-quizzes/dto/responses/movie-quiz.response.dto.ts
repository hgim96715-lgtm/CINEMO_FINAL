import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class MovieQuizRoundResponseDto {
  @ApiProperty({ example: "01a12345-6789-7abc-8def-0123456789ab" })
  roundId!: string;

  @ApiProperty({ example: "이 작품에서 시간은 지구와 다르게 흐릅니다. 이 영화는 무엇일까요?" })
  prompt!: string;

  @ApiProperty({
    example: ["인터스텔라", "테넷", "그래비티", "컨택트", "마션"],
    description: "무작위 순서의 5지선다 선택지",
  })
  choices!: string[];

  @ApiPropertyOptional({
    example: "https://image.tmdb.org/t/p/w500/poster.jpg",
    description: "정답을 맞히기 위한 포스터 일부 단서",
  })
  posterUrl!: string | null;

  @ApiProperty({ example: 2 })
  attemptsRemaining!: number;

  @ApiProperty({ enum: ["ACTIVE", "CORRECT", "FAILED"] })
  status!: "ACTIVE" | "CORRECT" | "FAILED";

  @ApiProperty({ example: 0 })
  scoreAwarded!: number;

  @ApiPropertyOptional({ example: "인터스텔라", description: "두 번 모두 틀린 경우에만 공개" })
  answer?: string;
}

export class MovieQuizLeaderboardEntryResponseDto {
  @ApiProperty({ example: 1 })
  rank!: number;

  @ApiProperty({ example: "영화광" })
  nickname!: string;

  @ApiPropertyOptional({ example: "https://..." })
  profileImageUrl!: string | null;

  @ApiProperty({ example: 580 })
  score!: number;

  @ApiProperty({ example: 7 })
  correctCount!: number;
}
