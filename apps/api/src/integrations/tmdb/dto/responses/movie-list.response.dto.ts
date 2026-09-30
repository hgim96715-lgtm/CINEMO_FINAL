import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TmdbMovieDateRangeResponseDto {
  @ApiProperty({
    example: "2026-09-01",
  })
  minimum!: string;

  @ApiProperty({
    example: "2026-10-01",
  })
  maximum!: string;
}

export class TmdbMovieListItemResponseDto {
  @ApiProperty({
    example: false,
  })
  adult!: boolean;

  @ApiProperty({
    example: 550,
  })
  id!: number;

  @ApiProperty({
    example: "파이트 클럽",
  })
  title!: string;

  @ApiProperty({
    example: "Fight Club",
  })
  original_title!: string;

  @ApiProperty({
    example: "en",
  })
  original_language!: string;

  @ApiProperty({
    example: "1999-10-15",
  })
  release_date!: string;

  @ApiProperty({
    type: [Number],
    example: [18],
  })
  genre_ids!: number[];

  @ApiPropertyOptional({
    nullable: true,
    example: "/poster.jpg",
  })
  poster_path!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: "/backdrop.jpg",
  })
  backdrop_path!: string | null;

  @ApiProperty({
    example: "영화 줄거리",
  })
  overview!: string;

  @ApiProperty({
    example: 85.4,
  })
  popularity!: number;

  @ApiProperty({
    example: 8.4,
  })
  vote_average!: number;

  @ApiProperty({
    example: 25000,
  })
  vote_count!: number;

  @ApiProperty({
    example: false,
  })
  video!: boolean;
}

export class TmdbMovieListResponseDto {
  @ApiProperty({
    example: 1,
  })
  page!: number;

  @ApiProperty({
    type: [TmdbMovieListItemResponseDto],
  })
  results!: TmdbMovieListItemResponseDto[];

  @ApiProperty({
    example: 10,
  })
  total_pages!: number;

  @ApiProperty({
    example: 200,
  })
  total_results!: number;

  @ApiPropertyOptional({
    type: TmdbMovieDateRangeResponseDto,
  })
  dates?: TmdbMovieDateRangeResponseDto;
}
