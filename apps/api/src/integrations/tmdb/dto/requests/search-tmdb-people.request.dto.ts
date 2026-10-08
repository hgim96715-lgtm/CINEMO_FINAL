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

export class SearchTmdbPeopleRequestDto {
  @ApiProperty({
    description: "검색할 인물 이름",
    type: String,
    example: "마이클 B. 조던",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  query!: string;

  @ApiProperty({
    description: "조회할 페이지 번호",
    type: Number,
    example: 1,
    default: 1,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  page = 1;
}
