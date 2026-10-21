import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class MobileRefreshRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  refreshToken!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceId?: string;
}
