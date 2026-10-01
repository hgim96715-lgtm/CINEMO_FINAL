import { ApiProperty } from "@nestjs/swagger";

export class MovieSitemapItemResponseDto {
  @ApiProperty({
    description: "CINEMO 내부 영화 UUID",
    example: "01a0f063-d740-7084-a1ea-ed5c020640bb",
  })
  id!: string;

  @ApiProperty({
    description: "영화 정보가 마지막으로 수정된 시각",
    example: "2026-10-01T03:37:50.144Z",
    format: "date-time",
  })
  updatedAt!: string;
}

export class MovieSitemapResponseDto {
  @ApiProperty({
    description: "sitemap에 포함할 영화 목록",
    type: [MovieSitemapItemResponseDto],
  })
  items!: MovieSitemapItemResponseDto[];
}
