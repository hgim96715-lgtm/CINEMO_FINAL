import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class ImportKobisReleasedMoviesRequestDto {
  @ApiProperty({ description: "개봉 연도", example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  releaseYear!: number;

  @ApiProperty({
    description: "페이지당 조회할 영화 수",
    example: 100,
    default: 100,
    required: false,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 100;
}
