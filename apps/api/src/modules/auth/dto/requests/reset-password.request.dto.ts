import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class ResetPasswordRequestDto {
  @ApiProperty({
    description: "비밀번호 재설정 링크에 포함된 토큰",
    example: "password-reset-token",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  token!: string;

  @ApiProperty({
    description: "새 비밀번호",
    example: "new-password-123!",
    minLength: 8,
    maxLength: 128,
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
