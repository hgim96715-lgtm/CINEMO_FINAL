import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class GetTmdbPersonRequestDto {
  @ApiProperty({
    description: "TMDB 외부 인물 식별자",
    type: Number,
    example: 135651,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tmdbPersonId!: number;
}
