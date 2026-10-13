import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {IsOptional, IsString, IsUUID, MaxLength} from "class-validator";

export class CreatePostcardCommentRequestDto {
  @ApiProperty({
    description: "댓글 내용",
    maxLength: 1000,
    example: "이 장면이 가장 오래 기억에 남았어요.",
  })
  @IsString()
  @MaxLength(1000)
  content: string;
  
  @ApiPropertyOptional({
    description: "대댓글 대상 댓글 ID",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}