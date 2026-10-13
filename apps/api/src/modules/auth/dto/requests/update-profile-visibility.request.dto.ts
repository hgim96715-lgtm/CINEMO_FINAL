import { ApiProperty } from "@nestjs/swagger";
import { UserVisibility } from "@prisma/client";
import { IsEnum } from "class-validator";

export class UpdateProfileVisibilityRequestDto {
  @ApiProperty({
    description: "프로필 공개 범위",
    enum: UserVisibility,
    example: UserVisibility.PRIVATE,
  })
  @IsEnum(UserVisibility)
  profileVisibility!: UserVisibility;
}
