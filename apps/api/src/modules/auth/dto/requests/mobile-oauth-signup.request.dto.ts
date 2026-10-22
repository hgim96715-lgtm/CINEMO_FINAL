import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

import { RegisterTermsDto } from "./register.request.dto";

export class MobileOauthSignupRequestDto {
  @ApiProperty({
    description: "소셜 로그인후  발급된 일회성 가입 티켓",
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
    description: "필수 및 선택 약관 동의",
    type: RegisterTermsDto,
  })
  @ValidateNested()
  @Type(() => RegisterTermsDto)
  terms!: RegisterTermsDto;

  @ApiPropertyOptional({
    description: "모바일 기기 식별자",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  deviceId?: string;
}
