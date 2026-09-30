import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TmdbMovieVideoResponseDto {
  @ApiPropertyOptional({
    nullable: true,
    example: "ko",
  })
  iso_639_1!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: "KR",
  })
  iso_3166_1!: string | null;

  @ApiProperty({
    example: "[어벤져스: 엔드게임 앙코르] 토니가 끝까지 지키고 싶었던 단 한 사람",
  })
  name!: string;

  @ApiProperty({
    example: "RwSZp1rwrWs",
  })
  key!: string;

  @ApiProperty({
    example: 1080,
  })
  size!: number;

  @ApiProperty({
    enum: ["YouTube", "Vimeo"],
    example: "YouTube",
  })
  site!: "YouTube" | "Vimeo";

  @ApiProperty({
    enum: ["Trailer", "Teaser", "Clip", "Featurette"],
    example: "Trailer",
  })
  type!: "Trailer" | "Teaser" | "Clip" | "Featurette";

  @ApiProperty({
    example: true,
  })
  official!: boolean;

  @ApiProperty({
    example: "6ab741497734a2ebd7eaad83",
  })
  id!: string;

  @ApiProperty({
    example: "2019-03-14T12:00:00.000Z",
  })
  published_at!: string;
}

export class TmdbMovieVideosResponseDto {
  @ApiProperty({
    example: 299534,
  })
  id!: number;

  @ApiProperty({
    type: [TmdbMovieVideoResponseDto],
  })
  results!: TmdbMovieVideoResponseDto[];
}
