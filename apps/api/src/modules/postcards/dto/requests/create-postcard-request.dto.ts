import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {IsEnum, IsOptional, IsString, IsUUID, MaxLength} from "class-validator";
import {PostcardType, PostcardVisibility} from "@prisma/client";

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
    description: "엽서 배경 스타일",
    example: "midnight",
    nullable: true,
    type:String
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  backgroundStyle: string|null;
  
  @ApiPropertyOptional({
    description: "Cloud Storage 배경 이미지 식별자",
    maxLength: 255,
    nullable: true,
    example: "postcards/backgrounds/01.webp",
    type:String
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