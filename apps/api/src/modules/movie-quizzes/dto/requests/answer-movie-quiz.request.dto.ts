import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class AnswerMovieQuizRequestDto {
  @ApiProperty({ example: "인터스텔라", description: "선택한 5지선다 답" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  choice!: string;
}
