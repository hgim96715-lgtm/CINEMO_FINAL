import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  Max,
  Min,
} from "class-validator";

export class ImportKobisMoviesRequestDto {
  @ApiProperty({
    description: "제작 연도 시작값",
    example: 2010,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  productionStartYear!: number;

  @ApiProperty({
    description: "제작 연도 종료값",
    example: 2020,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  productionEndYear!: number;

  @ApiProperty({
    description: "가져올 페이지 수",
    example: 2,
    default: 2,
    required: false,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  pageCount: number = 2;

  @ApiProperty({
    description: "페이지당 조회할 영화 수",
    example: 20,
    default: 20,
    required: false,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
