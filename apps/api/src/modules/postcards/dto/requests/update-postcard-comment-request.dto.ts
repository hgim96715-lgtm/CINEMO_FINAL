import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class UpdatePostcardCommentRequestDto {
  @ApiProperty({
    description: "수정할 댓글 내용",
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  content: string;
}
