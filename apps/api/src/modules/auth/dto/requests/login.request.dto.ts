import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class LoginRequestDto {
  @ApiProperty({
    description: "가입한 이메일",
    example: "user@cinemo.app",
  })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    description: "비밀번호",
    example: "strong-password-123!",
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}
