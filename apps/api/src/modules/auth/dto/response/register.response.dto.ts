import { ApiProperty } from "@nestjs/swagger";
import { UserStatus } from "@prisma/client";

export class RegisterUserResponseDto {
  @ApiProperty({
    description: "CINEMO 사용자 ID",
  })
  id!: string;

  @ApiProperty({
    description: "가입 이메일",
    example: "user@cinemo.app",
  })
  email!: string;

  @ApiProperty({
    description: "닉네임",
    example: "시네마광",
  })
  nickname!: string;

  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: Date;
}

export class RegisterResponseDto {
  @ApiProperty({
    type: RegisterUserResponseDto,
  })
  user!: RegisterUserResponseDto;

  @ApiProperty({
    description: "이메일 인증 필요 여부",
    example: true,
  })
  emailVerificationRequired!: boolean;
}
