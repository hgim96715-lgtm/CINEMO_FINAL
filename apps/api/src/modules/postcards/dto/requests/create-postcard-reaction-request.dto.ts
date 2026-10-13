import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class CreatePostcardReactionRequestDto {
  @ApiProperty({
    description: "이모지",
    maxLength: 64,
    example: "❤️",
  })
  @IsString()
  @MaxLength(64)
  emoji!: string;
}
