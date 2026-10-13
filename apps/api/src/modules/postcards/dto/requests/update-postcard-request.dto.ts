import {ApiPropertyOptional} from "@nestjs/swagger";
import {PostcardVisibility} from "@prisma/client";
import {IsEnum, IsOptional, IsString, MaxLength} from "class-validator";

export class UpdatePostcardRequestDto {
  @ApiPropertyOptional({
    description: "엽서 내용",
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({
    description: "엽서 배경 스타일",
    maxLength: 100,
    nullable: true,
    type:String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  backgroundStyle?: string | null;
  
  @ApiPropertyOptional({
    description: "Cloud Storage 배경 이미지 식별자",
    maxLength: 255,
    nullable: true,
    type:String,
    example: "postcards/backgrounds/01.webp",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  backgroundImageKey?: string | null;

  @ApiPropertyOptional({
    description: "엽서 공개 상태",
    enum: PostcardVisibility,
  })
  @IsOptional()
  @IsEnum(PostcardVisibility)
  visibility?: PostcardVisibility;
}
