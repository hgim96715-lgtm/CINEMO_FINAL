import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PostcardType } from "@prisma/client";
import {
  ArrayMaxSize,
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class PostcardTranslationDto {
  @ApiProperty({
    description: "번역 언어 코드",
    example: "ko",
  })
  @IsString()
  @MaxLength(20)
  language: string;

  @ApiProperty({
    description: "번역된 문장",
  })
  @IsString()
  @MaxLength(5000)
  content: string;

  @ApiProperty({
    enum: ["AI", "USER"],
    description: "번역 생성 주체",
  })
  @IsIn(["AI", "USER"])
  source: "AI" | "USER";
}

export class PostcardMetadataDto {
  @ApiProperty({
    enum: PostcardType,
  })
  @IsEnum(PostcardType)
  type: PostcardType;

  @ApiPropertyOptional({
    description: "감상 제목",
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string | null;

  @ApiPropertyOptional({
    description: "인용·장면 설명",
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  sceneDescription?: string | null;

  @ApiPropertyOptional({
    description: "장면 시간대",
    type: String,
    nullable: true,
    example: "01:12:30",
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  sceneTime?: string | null;

  @ApiPropertyOptional({
    description: "AI가 제안한 문장인지 여부",
    type: Boolean,
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  isAiSuggested?: boolean | null;

  @ApiPropertyOptional({
    description: "원문 언어 코드",
    type: String,
    nullable: true,
    example: "en",
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  originalLanguage?: string | null;

  @ApiPropertyOptional({
    description: "원문을 보존하기 위한 번역 목록",
    type: () => [PostcardTranslationDto],
    nullable: true,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PostcardTranslationDto)
  @ArrayMaxSize(5)
  translations?: PostcardTranslationDto[] | null;
}
