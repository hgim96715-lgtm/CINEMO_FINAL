import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateMovieQuizRequestDto {
  @ApiProperty({ example: "01a12345-6789-7abc-8def-0123456789ab" })
  @IsUUID()
  movieId!: string;

  @ApiProperty({ example: "이 작품에서 시간은 지구와 다르게 흐릅니다. 이 영화는 무엇일까요?" })
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(500)
  prompt!: string;
}
