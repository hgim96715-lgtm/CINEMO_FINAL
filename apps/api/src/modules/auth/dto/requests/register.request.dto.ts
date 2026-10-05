import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export class RegisterTermsDto {
  @ApiProperty({
    description: "서비스 이용약관 동의",
    example: true,
  })
  @IsBoolean()
  @Equals(true, {
    message: "서비스 이용약관 동의가 필요합니다.",
  })
  service!: boolean;

  @ApiProperty({
    description: "개인정보 처리방침 동의",
    example: true,
  })
  @IsBoolean()
  @Equals(true, {
    message: "개인정보 처리방침 동의가 필요합니다.",
  })
  privacy!: boolean;

  @ApiPropertyOptional({
    description: "마케팅 정보 수신 동의",
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  marketing = false;
}

export class RegisterRequestDto {
  @ApiProperty({
    description: "로그인에 사용할 이메일",
    example: "user@cinemo.app",
  })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    description: "비밀번호",
    example: "strong-password-123!",
    minLength: 8,
    maxLength: 128,
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({
    description: "CINEMO에서 사용할 닉네임",
    example: "시네마광",
    minLength: 2,
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(30)
  nickname!: string;

  @ApiProperty({
    description: "회원가입 약관 동의",
    type: RegisterTermsDto,
  })
  @ValidateNested()
  @Type(() => RegisterTermsDto)
  terms!: RegisterTermsDto;
}
