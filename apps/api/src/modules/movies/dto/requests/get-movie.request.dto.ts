import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class GetMovieRequestDto {
  @ApiProperty({
    description: "CINEMO 내부 영화 UUID",
    example: "0198f7a4-7b6e-7abc-8def-123456789abc",
  })
  @IsUUID()
  movieId!: string;
}
