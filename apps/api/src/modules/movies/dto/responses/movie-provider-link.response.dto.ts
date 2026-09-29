import { ApiProperty } from "@nestjs/swagger";

export class MovieProviderLinkResponseDto {
  @ApiProperty({ description: "외부 영화 데이터 제공처", example: "TMDB" })
  sourceProvider!: string;

  @ApiProperty({ description: "외부 provider가 발급한 영화 식별자" })
  externalId!: string;

  @ApiProperty({ description: "외부 영화 연결 방식", example: "AUTO" })
  matchMethod!: string;

  @ApiProperty({
    description: "외부 영화 연결 검토 상태",
    example: "APPROVED",
  })
  matchStatus!: string;

  @ApiProperty({
    description: "자동 매칭 신뢰도",
    type: Number,
    nullable: true,
    example: 0.98,
  })
  confidence!: number | null;

  @ApiProperty({
    description: "외부 영화 연결을 확인한 시각",
    type: String,
    nullable: true,
  })
  verifiedAt!: string | null;
}
