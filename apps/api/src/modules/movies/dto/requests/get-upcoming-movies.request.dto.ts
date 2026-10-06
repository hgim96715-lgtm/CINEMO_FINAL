import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Matches, Max, Min } from "class-validator";

export enum UpcomingMoviesPeriod {
  THIS_WEEK = "this-week",
}

export class GetUpcomingMoviesRequestDto {
  @ApiPropertyOptional({
    description: "기간 필터",
    enum: UpcomingMoviesPeriod,
    example: UpcomingMoviesPeriod.THIS_WEEK,
  })
  @IsOptional()
  @IsEnum(UpcomingMoviesPeriod)
  period?: UpcomingMoviesPeriod;

  @ApiPropertyOptional({
    description: "개봉 예정 월. YYYY-MM 형식",
    example: "2026-11",
  })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: "yearMonth는 YYYY-MM 형식이어야 합니다.",
  })
  yearMonth?: string;

  @ApiPropertyOptional({ default: 1, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
