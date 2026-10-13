import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PostcardType } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class PostcardMetadataDto {
  @ApiProperty({
    enum: PostcardType,
  })
  @IsEnum(PostcardType)
  type: PostcardType;

  @ApiPropertyOptional({
    description: "감상 제목",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string | null;

  @ApiPropertyOptional({
    description: "인용·장면 설명",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  sceneDescription?: string | null;

  @ApiPropertyOptional({
    description: "장면 시간대",
    nullable: true,
    example: "01:12:30",
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  sceneTime?: string | null;

  @ApiPropertyOptional({
    description: "AI가 제안한 문장인지 여부",
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  isAiSuggested?: boolean;

  @ApiPropertyOptional({
    enum: ["HOME", "THEATER", "OTHER"],
    nullable: true,
  })
  @IsOptional()
  @IsIn(["HOME", "THEATER", "OTHER"])
  venueType?: "HOME" | "THEATER" | "OTHER";

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  venueName?: string | null;

  @ApiPropertyOptional({
    enum: ["ALONE", "FRIEND", "FAMILY", "PARTNER", "OTHER"],
    nullable: true,
  })
  @IsOptional()
  @IsIn(["ALONE", "FRIEND", "FAMILY", "PARTNER", "OTHER"])
  companionType?:
    | "ALONE"
    | "FRIEND"
    | "FAMILY"
    | "PARTNER"
    | "OTHER";

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  companionName?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: "2026-10-13",
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  watchedAt?: string | null;
}
