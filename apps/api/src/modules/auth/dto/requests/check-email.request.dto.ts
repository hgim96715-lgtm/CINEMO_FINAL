import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, MaxLength } from "class-validator";

export class CheckEmailRequestDto {
  @ApiProperty({
    description: "중복 확인할 이메일",
    example: "user@cinemo.app",
  })
  @IsEmail({}, { message: "올바른 이메일 형식을 입력해주세요." })
  @MaxLength(254)
  email!: string;
}
