import { ApiProperty } from "@nestjs/swagger";
import { PushTokenPlatform } from "@prisma/client";

export class RegisterPushTokenResponseDto {
  @ApiProperty({
    description: "푸시 토큰 레코드 ID",
    format: "uuid",
  })
  id!: string;

  @ApiProperty({
    description: "Expo Push Token",
    example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  })
  token!: string;

  @ApiProperty({
    description: "푸시 토큰 플랫폼",
    enum: PushTokenPlatform,
    example: PushTokenPlatform.IOS,
  })
  platform!: PushTokenPlatform;

  @ApiProperty({
    description: "마지막 등록·갱신 시각",
    type: String,
    format: "date-time",
  })
  lastUsedAt!: Date;
}
