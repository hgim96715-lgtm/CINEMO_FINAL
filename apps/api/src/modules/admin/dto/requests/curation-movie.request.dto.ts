import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export class CurationMovieRequestDto {
  @ApiProperty({ description: "CINEMO 내부 영화 UUID" })
  @IsUUID()
  movieId!: string;

  @ApiPropertyOptional({ description: "영화를 선택한 이유", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;

  @ApiPropertyOptional({ description: "큐레이션 내 노출 순서", default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder = 0;
}
