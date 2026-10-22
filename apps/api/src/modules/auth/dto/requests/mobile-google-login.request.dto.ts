import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class MobileGoogleLoginRequestDto {
  @ApiProperty({
    description: "Google native 로그인에서 받은 ID token",
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  identityToken!: string;

  @ApiPropertyOptional({
    description: "모바일 기기 식별자",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  deviceId?: string;
}
