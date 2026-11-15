import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches } from "class-validator";

export class GetCinemaVenuesRequestDto {
  @ApiPropertyOptional({
    description: "광역지역 코드",
    example: "41",
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}$/)
  region1Code?: string;

  @ApiPropertyOptional({
    description: "시·군·구 코드",
    example: "41110",
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{5}$/)
  region2Code?: string;

  @ApiPropertyOptional({
    description: "읍·면·동 코드",
    example: "41110520",
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/)
  region3Code?: string;
}
