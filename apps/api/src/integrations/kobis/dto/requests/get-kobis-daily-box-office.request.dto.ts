import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class GetKobisDailyBoxOfficeRequestDto {
  @ApiProperty({
    description: "박스오피스 조회 기준일",
    example: "20261001",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8}$/, {
    message: "targetDt는 YYYYMMDD 형식이어야 합니다.",
  })
  targetDt!: string;
}
