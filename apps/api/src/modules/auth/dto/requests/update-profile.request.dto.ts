import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateProfileRequestDto {
  @IsString()
  @MaxLength(120)
  nickname!: string;

  @IsOptional()
  @IsIn(["true"])
  removeImage?: "true";
}
