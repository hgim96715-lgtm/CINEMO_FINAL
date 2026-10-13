import { ApiProperty } from "@nestjs/swagger";

export class PostcardQuoteSuggestionResponseDto {
  @ApiProperty({
    description: "AI가 생성한 원문",
    example: "Love is the one thing that transcends time and space.",
  })
  original!: string;

  @ApiProperty({
    description: "원문의 한국어 번역",
    example: "사랑은 시간과 공간을 초월하는 유일한 것이다.",
  })
  translation!: string;

  @ApiProperty({
    description: "원문 언어 코드",
    example: "en",
  })
  sourceLanguage!: string;

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
}
