import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreatePostcardShareRequestDto {
  @ApiPropertyOptional({
    description: "공유 채널",
    maxLength: 50,
    example: "copy_link",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  channel?: string | null;
}
