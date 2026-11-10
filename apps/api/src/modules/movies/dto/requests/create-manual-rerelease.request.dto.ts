import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsIn, IsOptional } from "class-validator";

const theaterExclusives = ["CGV", "MEGABOX", "LOTTE_CINEMA"] as const;

export class CreateManualRereleaseRequestDto {
  @ApiProperty({
    description: "관리자가 직접 확인한 국내 재개봉일(YYYY-MM-DD)",
    example: "2026-11-19",
  })
  @IsDateString()
  releaseDate!: string;

  @ApiPropertyOptional({
    description: "단독 개봉 극장. 없으면 일반 개봉",
    enum: theaterExclusives,
    nullable: true,
    example: "CGV",
  })
  @IsOptional()
  @IsIn(theaterExclusives)
  theaterExclusive?: (typeof theaterExclusives)[number] | null;
}
