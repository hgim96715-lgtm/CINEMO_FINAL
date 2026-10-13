import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class CreatePostcardReportRequestDto {
  @ApiProperty({
    description: "신고 사유",
    maxLength: 1000,
    example: "스팸성 내용입니다.",
  })
  @IsString()
  @MaxLength(1000)
  reason!: string;
}
