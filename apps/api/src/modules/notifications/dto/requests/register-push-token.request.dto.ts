import { ApiProperty } from "@nestjs/swagger";
import { PushTokenPlatform } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RegisterPushTokenRequestDto {
  @ApiProperty({
    description: "Expo Push Token",
    example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    maxLength: 512,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token!: string;

  @ApiProperty({
    description: "푸시 토큰이 발급된 모바일 플랫폼",
    enum: PushTokenPlatform,
    example: PushTokenPlatform.IOS,
  })
  @IsEnum(PushTokenPlatform)
  platform!: PushTokenPlatform;
}
