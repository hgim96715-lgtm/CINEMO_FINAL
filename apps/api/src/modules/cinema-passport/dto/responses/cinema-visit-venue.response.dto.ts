import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CinemaVisitVenueResponseDto {
  @ApiProperty({
    description: "영화관 ID",
    type: String,
    format: "uuid",
  })
  id!: string;

  @ApiProperty({
    description: "영화관 이름",
    type: String,
  })
  name!: string;

  @ApiPropertyOptional({
    description: "영화관 브랜드",
    type: String,
    nullable: true,
  })
  brand!: string | null;

  @ApiPropertyOptional({
    description: "영화관 주소",
    type: String,
    nullable: true,
  })
  address!: string | null;
}
