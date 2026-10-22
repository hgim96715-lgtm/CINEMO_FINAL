import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class MobileNaverStartRequestDto {
  @ApiProperty({
    description: "모바일 앱에서 생성한 일회성 OAuth state",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  state!: string;
}
