import { ApiProperty } from "@nestjs/swagger";

export class KobisPersonResponseDto {
  @ApiProperty({ description: "인물 이름" })
  name!: string;

  @ApiProperty({ description: "외국어 인물 이름", nullable: true })
  nameEn!: string | null;
}
