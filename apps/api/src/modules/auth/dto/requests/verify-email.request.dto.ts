import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class VerifyEmailRequestDto {
  @ApiProperty({
    description: "이메일 인증 링크에 포함된 일회성 토큰",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  token!: string;
}
