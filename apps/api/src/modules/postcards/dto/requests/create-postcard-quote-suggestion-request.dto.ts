import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreatePostcardQuoteSuggestionRequestDto {
  @ApiPropertyOptional({
    description: "정확한 영화 매칭에 사용할 영화 ID",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  movieId?: string;

  @ApiProperty({
    description: "영화 제목",
    example: "인터스텔라",
  })
  @IsString()
  @MaxLength(300)
  movieTitle!: string;

  @ApiPropertyOptional({
    description: "사용자가 작성한 감상",
    example: "시간과 가족에 대한 감정이 오래 남았다.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  review?: string;

  @ApiPropertyOptional({
    description: "원문 추천 언어. 비워두면 AI가 추론",
    example: "en",
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;
}
