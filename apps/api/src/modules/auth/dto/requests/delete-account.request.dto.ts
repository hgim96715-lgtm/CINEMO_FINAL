import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class DeleteAccountRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  appleAuthorizationCode?: string;
}
