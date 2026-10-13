import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { PostcardQuoteSource, PostcardVisibility } from "@prisma/client";

import { PostcardMediaDto } from "./postcard-media.dto";
import { PostcardMetadataDto } from "./postcard-metadata.dto";
import { PostcardStyleDto } from "./postcard-style.dto";

export class UpdatePostcardRequestDto {
  @ApiPropertyOptional({
    description: "QUOTE 원문의 근거",
    enum: PostcardQuoteSource,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(PostcardQuoteSource)
  quoteSource?: PostcardQuoteSource | null;

  @ApiPropertyOptional({
    description: "엽서 본문",
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({
    type: () => PostcardMetadataDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PostcardMetadataDto)
  metadata?: PostcardMetadataDto | null;

  @ApiPropertyOptional({
    type: () => PostcardStyleDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PostcardStyleDto)
  style?: PostcardStyleDto | null;

  @ApiPropertyOptional({
    type: () => [PostcardMediaDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostcardMediaDto)
  media?: PostcardMediaDto[];

  @ApiPropertyOptional({
    description: "기존 배경 preset 호환용",
    type: String,
    maxLength: 100,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  backgroundStyle?: string | null;

  @ApiPropertyOptional({
    description: "Cloud Storage 배경 이미지 식별자",
    type: String,
    maxLength: 255,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  backgroundImageKey?: string | null;

  @ApiPropertyOptional({
    description: "엽서 공개 범위",
    enum: PostcardVisibility,
  })
  @IsOptional()
  @IsEnum(PostcardVisibility)
  visibility?: PostcardVisibility;
}
