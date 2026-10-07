import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class ImportTmdbPostersRequestDto {
  @ApiPropertyOptional({
    description: "이번에 포스터를 보강할 영화 수",
    example: 100,
    default: 100,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit = 100;
}
