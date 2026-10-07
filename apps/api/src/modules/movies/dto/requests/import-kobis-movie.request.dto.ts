import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, Matches } from "class-validator";

export class ImportKobisMovieRequestDto {
  @ApiPropertyOptional({
    description: "이번에 저장할 국내 개봉일. 재개봉일을 지정할 때 사용",
    example: "2026-10-08",
  })
  @IsOptional()
  @Matches(/^\d{4}-?\d{2}-?\d{2}$/)
  releaseDate?: string;
}
