import {ApiPropertyOptional} from "@nestjs/swagger";
import {ViewingPlaceType} from "@prisma/client";
import {IsBoolean, IsDateString, IsDecimal, IsEnum, IsOptional, IsUUID, Matches,} from "class-validator";

export class UpdateMovieRecordRequestDto {
  @ApiPropertyOptional({
    description: "찜하기 여부",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @ApiPropertyOptional({
    description: "봤어요 여부",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isWatched?: boolean;

  @ApiPropertyOptional({
    description: "봤어요로 기록할 날짜. YYYY-MM-DD 형식",
    example: "2026-10-06",
    nullable: true,
    format: "date",
  })
  @IsOptional()
  @IsDateString()
  watchedAt?: string | null;

  @ApiPropertyOptional({
    description: "개인 평점. 0.5~5.0, null이면 평점 삭제",
    example: "4.5",
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: "0,1" })
  @Matches(/^(?:0\.5|[1-4](?:\.0|\.5)?|5(?:\.0)?)$/, {
    message: "평점은 0.5부터 5.0까지 0.5 단위로 입력해주세요.",
  })
  rating?: string | null;

  @ApiPropertyOptional({
    description: "관람 장소 ID. 집에서 본 경우 null",
    example: "01a12345-6789-7123-8456-789012345678",
    format: "uuid",
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  venueId?: string | null;

  @ApiPropertyOptional({
    description: "관람 방식",
    enum: ViewingPlaceType,
    example: ViewingPlaceType.VENUE,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(ViewingPlaceType)
  viewingPlaceType?: ViewingPlaceType | null;
}
