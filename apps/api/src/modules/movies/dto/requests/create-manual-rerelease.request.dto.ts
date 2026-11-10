import { ApiProperty } from "@nestjs/swagger";
import { IsDateString } from "class-validator";

export class CreateManualRereleaseRequestDto {
  @ApiProperty({
    description: "관리자가 직접 확인한 국내 재개봉일(YYYY-MM-DD)",
    example: "2026-11-19",
  })
  @IsDateString()
  releaseDate!: string;
}
