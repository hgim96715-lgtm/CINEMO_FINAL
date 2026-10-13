import {ApiPropertyOptional} from "@nestjs/swagger";
import {Type} from "class-transformer";
import {IsInt, IsOptional, IsUUID, Max, Min} from "class-validator";

export class GetPostcardFeedRequestDto {
  @ApiPropertyOptional({
    description: "마지막으로 조회한 엽서 ID",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  cursor?: string;
  
  @ApiPropertyOptional({
    description: "페이지당 엽서 개수",
    default: 20,
    minimum: 1,
    maximum: 50,
    type:Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 20;
}