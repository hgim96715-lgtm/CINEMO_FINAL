import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, MaxLength } from "class-validator";

export class RequestPasswordResetRequestDto {
  @ApiProperty({
    description: "비밀번호 재설정 링크를 받을 이메일",
    example: "user@cinemo.app",
  })
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
