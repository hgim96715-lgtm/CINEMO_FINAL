import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { PostcardType, PostcardVisibility } from "@prisma/client";

import { PostcardMediaDto } from "./postcard-media.dto";
import { PostcardMetadataDto } from "./postcard-metadata.dto";
import { PostcardStyleDto } from "./postcard-style.dto";

export class CreatePostcardRequestDto {
  @ApiProperty({
    description: "엽서를 작성할 영화 ID",
    format: "uuid",
  })
  @IsUUID()
  movieId: string;
  
  @ApiProperty({
    enum: PostcardType,
    example: PostcardType.REVIEW,
  })
  @IsEnum(PostcardType)
  type: PostcardType;
  
  @ApiProperty({
    description: "엽서 내용",
    maxLength: 5000,
  })
  @IsString()
  @MaxLength(5000)
  content: string;
  
  @ApiPropertyOptional({
    description: "기존 배경 preset 호환용",
    example: "midnight",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  backgroundStyle?: string | null;

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
    description: "Cloud Storage 배경 이미지 식별자",
    maxLength: 255,
    nullable: true,
    example: "postcards/backgrounds/01.webp",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  backgroundImageKey?: string | null;
  
  @ApiPropertyOptional({
    enum: PostcardVisibility,
    default: PostcardVisibility.PRIVATE,
  })
  @IsOptional()
  @IsEnum(PostcardVisibility)
  visibility?: PostcardVisibility;
}
