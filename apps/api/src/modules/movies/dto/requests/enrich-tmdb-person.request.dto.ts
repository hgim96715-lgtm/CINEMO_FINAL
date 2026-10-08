import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsUUID, Min } from "class-validator";

export class EnrichTmdbPersonRequestDto {
  @ApiProperty({
    description: "CINEMO 내부 인물 UUID",
    type: String,
    example: "01a0fa2c-e356-70e9-812b-9e6ef3b3068e",
  })
  @IsUUID()
  personId!: string;

  @ApiProperty({
    description: "TMDB 외부 인물 식별자",
    type: Number,
    example: 6193,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tmdbPersonId!: number;
}
