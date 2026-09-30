import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsUUID, Min } from "class-validator";

export class EnrichTmdbMovieRequestDto {
  @ApiProperty({
    description: "CINEMO 내부 영화 UUID",
  })
  @IsUUID()
  movieId!: string;

  @ApiProperty({
    description: "TMDB 외부 영화 식별자",
    example: 299534,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tmdbMovieId!: number;
}
