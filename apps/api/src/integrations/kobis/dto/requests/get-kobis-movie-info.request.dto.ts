import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class GetKobisMovieInfoRequestDto {
  @ApiProperty({
    description: "KOBIS 영화 코드",
    example: "20266766",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  movieCd!: string;
}
