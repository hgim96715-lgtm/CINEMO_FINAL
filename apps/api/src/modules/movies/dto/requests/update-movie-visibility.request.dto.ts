import { MovieVisibility } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateMovieVisibilityRequestDto {
  @ApiProperty({ enum: MovieVisibility })
  @IsEnum(MovieVisibility)
  visibility!: MovieVisibility;

  @ApiPropertyOptional({ nullable: true, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  moderationReason?: string | null;
}
