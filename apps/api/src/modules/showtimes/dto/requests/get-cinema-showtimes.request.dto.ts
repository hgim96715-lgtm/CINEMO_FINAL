import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class GetCinemaShowtimesRequestDto {
  @ApiProperty({ description: "CINEMO에 표시된 영화 제목", example: "듄" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  movieTitle!: string;

  @ApiProperty({ type: Number, example: 37.5016, description: "현재 위도" })
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ type: Number, example: 127.0263, description: "현재 경도" })
  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({
    example: "2026-11-17",
    description: "조회 날짜. 생략 시 한국 시간 기준 오늘",
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
