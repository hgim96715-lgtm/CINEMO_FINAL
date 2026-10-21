import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class MobileAppleLoginRequestDto {
  @ApiProperty({
    description: "Apple native 로그인에서 받은 identity token",
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  identityToken!: string;

  @ApiPropertyOptional({
    description: "Apple native 로그인에서 받은 authorization code",
    writeOnly: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  authorizationCode?: string;

  @ApiPropertyOptional({
    description: "모바일 기기 식별자",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  deviceId?: string;
}
