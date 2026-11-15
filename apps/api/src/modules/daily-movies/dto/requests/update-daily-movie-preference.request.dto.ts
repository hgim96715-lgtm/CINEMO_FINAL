import { IsBoolean, IsOptional, IsUUID } from "class-validator";

export class UpdateDailyMoviePreferenceRequestDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsUUID()
  pushTokenId?: string;
}
