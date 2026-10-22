import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class MobileNaverExchangeRequestDto {
  @ApiProperty({
    description: "네이버 Callback에서 받은 일회성 인증 코드",
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  code!: string;

  @ApiProperty({
    description: "모바일 앱에서 생성한 OAuth state",
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  state!: string;

  @ApiPropertyOptional({
    description: "모바일 기기 식별자",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  deviceId?: string;
}
