import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

import { RegisterTermsDto } from "./register.request.dto";

export class OauthSignupRequestDto {
  @ApiProperty({
    description: "Apple 인증 후 발급된 일회성 가입 티켓",
  })
  @IsString()
  @IsNotEmpty()
  ticket!: string;

  @ApiProperty({
    description: "CINEMO에서 사용할 닉네임",
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
