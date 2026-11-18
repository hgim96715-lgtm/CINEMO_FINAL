import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TheaterExclusive } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUrl, Matches } from "class-validator";

export class UpsertCinemaChainVenueRequestDto {
  @ApiProperty({ enum: TheaterExclusive, example: TheaterExclusive.CGV })
  @IsEnum(TheaterExclusive)
  chain!: TheaterExclusive;

  @ApiProperty({ description: "체인 공식 극장 코드", example: "0056" })
  @IsString()
  @Matches(/^[A-Za-z0-9|_-]+$/)
  externalCode!: string;

  @ApiPropertyOptional({ example: "CGV 용산아이파크몰" })
  @IsOptional()
  @IsString()
  officialName?: string;

  @ApiPropertyOptional({ example: "https://www.cgv.co.kr/cnm/movieBook" })
  @IsOptional()
  @IsUrl({ protocols: ["https"] })
  bookingUrl?: string;
}
