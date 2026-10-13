import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

export class GetPostcardNotificationsRequestDto {
  @ApiPropertyOptional({ description: "마지막으로 조회한 알림 ID", format: "uuid" })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({
    description: "페이지당 알림 개수",
    default: 20,
    minimum: 1,
    maximum: 50,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: "읽지 않은 알림만 조회", default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unreadOnly?: boolean = false;
}
