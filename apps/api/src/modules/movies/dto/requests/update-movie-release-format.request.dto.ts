import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional } from "class-validator";

const theaterExclusives = ["CGV", "MEGABOX", "LOTTE_CINEMA"] as const;

export class UpdateMovieReleaseFormatRequestDto {
  @ApiPropertyOptional({
    description: "개봉 형태. 값을 비우면 일반 개봉",
    enum: theaterExclusives,
    nullable: true,
    example: "CGV",
  })
  @IsOptional()
  @IsIn(theaterExclusives)
  theaterExclusive?: (typeof theaterExclusives)[number] | null;
}
