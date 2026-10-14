import { ApiProperty } from "@nestjs/swagger";
import { PostcardQuoteSource } from "@prisma/client";

export class PostcardQuoteSuggestionResponseDto {
  @ApiProperty({
    description: "확인 가능한 실제 영화 문구를 찾았는지 여부",
    example: true,
  })
  found!: boolean;

  @ApiProperty({
    description: "확인된 영화 문구 원문",
    example: "Love is the one thing that transcends time and space.",
  })
  original!: string | null;

  @ApiProperty({
    description: "원문의 한국어 번역",
    example: "사랑은 시간과 공간을 초월하는 유일한 것이다.",
  })
  translation!: string | null;

  @ApiProperty({
    description: "원문 언어 코드",
    example: "en",
  })
  sourceLanguage!: string | null;

  @ApiProperty({
    description: "번역 언어 코드",
    example: "ko",
  })
  targetLanguage!: "ko";

  @ApiProperty({
    description: "AI 생성 결과인지 여부",
    example: true,
  })
  isAiSuggested!: true;

  @ApiProperty({
    description: "추천 문구의 근거",
    enum: PostcardQuoteSource,
    example: PostcardQuoteSource.USER,
  })
  quoteSource!: PostcardQuoteSource;
}
