import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class GetTmdbMovieRequestDto {
  @ApiProperty({
    description: "TMDB 외부 영화 식별자",
    example: 299534,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tmdbMovieId!: number;
}
