import { IsString, MaxLength } from "class-validator";

export class UpdateProfileRequestDto {
  @IsString()
  @MaxLength(120)
  nickname!: string;
}
