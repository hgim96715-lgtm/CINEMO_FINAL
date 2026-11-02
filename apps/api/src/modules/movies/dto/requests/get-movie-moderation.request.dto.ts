import { MovieVisibility } from "@prisma/client";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class GetMovieModerationRequestDto {
  @ApiPropertyOptional({
    description: "언어와 관계없이 영화 제목 또는 UUID로 검색",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  query?: string;

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
