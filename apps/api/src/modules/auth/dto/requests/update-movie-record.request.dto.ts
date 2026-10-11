import {ApiPropertyOptional} from "@nestjs/swagger";
import {ViewingPlaceType, ViewingPlatform} from "@prisma/client";
import {IsBoolean, IsDateString, IsDecimal, IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength,} from "class-validator";

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
    type: String,
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
  
  @ApiPropertyOptional({
    description: "집에서 영화를 본 플랫폼",
    enum: ViewingPlatform,
    example: ViewingPlatform.NETFLIX,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(ViewingPlatform)
  viewingPlatform?: ViewingPlatform | null;

  @ApiPropertyOptional({
    description: "기타 플랫폼을 선택했을 때 입력하는 플랫폼명",
    type: String,
    example: "쿠팡플레이",
    nullable: true,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  viewingPlatformCustom?: string | null;
}
