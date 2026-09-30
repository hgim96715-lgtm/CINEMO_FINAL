import { ApiProperty } from "@nestjs/swagger";

export class TmdbMovieGenreResponseDto {
  @ApiProperty({
    example: 28,
  })
  id!: number;

  @ApiProperty({
    example: "액션",
  })
  name!: string;
}

export class TmdbMovieGenreListResponseDto {
  @ApiProperty({
    type: [TmdbMovieGenreResponseDto],
  })
  genres!: TmdbMovieGenreResponseDto[];
}
