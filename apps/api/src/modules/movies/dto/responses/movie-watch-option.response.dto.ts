import { ApiProperty } from "@nestjs/swagger";

export class MovieWatchOptionResponseDto {
  @ApiProperty({ description: "시청 가능한 플랫폼", example: "NETFLIX" })
  watchProvider!: string;

  @ApiProperty({ description: "시청 방식", example: "STREAM" })
  availabilityType!: string;

  @ApiProperty({ description: "서비스 제공 지역 코드", example: "KR" })
  regionCode!: string;

  @ApiProperty({ description: "시청 페이지 주소" })
  url!: string;

  @ApiProperty({
    description: "서비스 정보 만료 시각",
    type: String,
    nullable: true,
  })
  expiresAt!: string | null;

  @ApiProperty({
    description: "서비스 정보를 마지막으로 확인한 시각",
    type: String,
    nullable: true,
  })
  lastVerifiedAt!: string | null;
}
