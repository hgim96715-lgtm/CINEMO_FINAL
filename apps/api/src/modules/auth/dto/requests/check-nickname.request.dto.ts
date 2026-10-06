import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CheckNicknameRequestDto {
  @ApiProperty({
    description: "중복 확인할 닉네임",
    example: "시네마광",
  })
  @IsString()
  @IsNotEmpty({ message: "닉네임을 입력해주세요." })
  @MinLength(2, { message: "닉네임은 2자 이상 입력해주세요." })
  @MaxLength(30, { message: "닉네임은 30자 이하로 입력해주세요." })
  nickname!: string;
}
