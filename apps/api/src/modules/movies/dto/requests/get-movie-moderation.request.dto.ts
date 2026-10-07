import { MovieVisibility } from "@prisma/client";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";

export class GetMovieModerationRequestDto {
  @ApiPropertyOptional({ enum: MovieVisibility, default: MovieVisibility.REVIEW })
  @IsOptional()
  @IsEnum(MovieVisibility)
  visibility: MovieVisibility = MovieVisibility.REVIEW;

  @ApiPropertyOptional({ default: 1, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 50, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}
