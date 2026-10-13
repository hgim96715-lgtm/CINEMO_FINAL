import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsHexColor,
  IsIn,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class PostcardStyleDto {
  @ApiProperty({
    enum: ["POSTER", "SOLID", "GRADIENT", "IMAGE"],
  })
  @IsIn(["POSTER", "SOLID", "GRADIENT", "IMAGE"])
  backgroundType: "POSTER" | "SOLID" | "GRADIENT" | "IMAGE";

  @ApiPropertyOptional({
    nullable: true,
    example: "#102326",
  })
  @IsOptional()
  @IsHexColor()
  backgroundColor?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: "#FFFFFF",
  })
  @IsOptional()
  @IsHexColor()
  textColor?: string | null;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: 1,
    example: 0.4,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  overlayOpacity?: number;

  @ApiPropertyOptional({
    enum: ["LEFT", "CENTER", "RIGHT"],
  })
  @IsOptional()
  @IsIn(["LEFT", "CENTER", "RIGHT"])
  textAlign?: "LEFT" | "CENTER" | "RIGHT";
}
