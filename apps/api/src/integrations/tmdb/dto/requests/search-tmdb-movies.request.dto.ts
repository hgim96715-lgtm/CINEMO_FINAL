import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class SearchTmdbMoviesRequestDto {
  @ApiProperty({
    description: "검색할 영화 제목",
    example: "어벤져스",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  query!: string;

  @ApiProperty({
    description: "조회할 페이지 번호",
    example: 1,
    default: 1,
    required: false,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  page: number = 1;
}
