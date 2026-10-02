import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class GetPopularMoviesRequestDto {
  @ApiProperty({
    type: Number,
    description: "조회할 페이지 번호",
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({
    type: Number,
    description: "페이지당 인기 영화 수",
    example: 5,
    default: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 5;
}
