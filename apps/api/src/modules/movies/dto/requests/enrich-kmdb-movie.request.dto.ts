import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class EnrichKmdbMovieRequestDto {
  @ApiProperty({
    description: "CINEMO 내부 영화 UUID",
  })
  @IsUUID()
  movieId!: string;

  @ApiProperty({
    description: "KMDb 외부 영화 식별자",
    example: "F47641",
  })
  @IsString()
  @IsNotEmpty()
  docId!: string;
}
