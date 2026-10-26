import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class GetMovieGenreAnalyticsRequestDto {
  @ApiPropertyOptional({
    example: 2026,
    description: "조회할 연도",
    default: 2026,
  })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year = new Date().getUTCFullYear();

  @ApiPropertyOptional({
    example: 10,
    description: "조회할 월",
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month = new Date().getUTCMonth() + 1;
}
