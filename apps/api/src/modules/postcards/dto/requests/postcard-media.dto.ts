import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PostcardMediaType } from "@prisma/client";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class PostcardMediaDto {
  @ApiProperty({
    enum: PostcardMediaType,
  })
  @IsEnum(PostcardMediaType)
  type: PostcardMediaType;

  @ApiPropertyOptional({
    nullable: true,
    example: "https://example.com/scene.webp",
  })
  @IsOptional()
  @IsUrl({
    protocols: ["https"],
    require_protocol: true,
  })
  url?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: "postcards/scenes/scene-01.webp",
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  storageKey?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: "주인공이 기차역에서 기다리는 장면",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  altText?: string | null;

  @ApiPropertyOptional({
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  sortOrder?: number;
}
