import {ApiProperty} from "@nestjs/swagger";
import {Type} from "class-transformer";
import {IsInt, Max, Min} from "class-validator";

export class GetMovieCalendarRequestDto {
  @ApiProperty({
    description: "조회할 연도",
    example: 2026,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year!: number;
  
  @ApiProperty({
    description: "조회할 월",
    example: 10,
    minimum: 1,
    maximum: 12,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}