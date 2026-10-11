import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {VenueType, ViewingPlaceType, ViewingPlatform} from "@prisma/client";

class VenueSummaryResponseDto {
  @ApiProperty({
    description: "관람 장소 ID",
    format: "uuid",
  })
  id!: string;

  @ApiProperty({
    description: "관람 장소 유형",
    enum: VenueType,
    example: VenueType.CINEMA,
  })
  type!: VenueType;

  @ApiProperty({
    description: "관람 장소 이름",
    example: "CGV 청담씨네시티",
  })
  name!: string;

  @ApiPropertyOptional({
    description: "관람 장소 브랜드명",
    example: "CGV",
    nullable: true,
  })
  brandName!: string | null;

  @ApiPropertyOptional({
    description: "도로명 주소",
    example: "서울 강남구 도산대로 323",
    nullable: true,
  })
  roadAddress!: string | null;

  @ApiPropertyOptional({
    description: "지번 주소",
    example: "서울 강남구 신사동 651-21",
    nullable: true,
  })
  jibunAddress!: string | null;
}

export class UserMovieRecordResponseDto {
  @ApiProperty({
    description: "영화 ID",
    format: "uuid",
  })
  movieId!: string;

  @ApiProperty({
    description: "찜하기 여부",
  })
  isFavorite!: boolean;

  @ApiProperty({
    description: "봤어요 여부",
  })
  isWatched!: boolean;

  @ApiProperty({
    description: "봤어요 처리 시각",
    type: String,
    format: "date-time",
    nullable: true,
  })
  watchedAt!: string | null;

  @ApiProperty({
    description: "개인 평점",
    type: String,
    example: "4.5",
    nullable: true,
  })
  rating!: string | null;

  @ApiProperty({
    description: "관람 장소 ID",
    format: "uuid",
    nullable: true,
    type:String,
    example: "01a12345-6789-7123-8456-789012345678",
  })
  venueId!: string | null;

  @ApiPropertyOptional({
    description: "관람 방식",
    enum: ViewingPlaceType,
    example: ViewingPlaceType.VENUE,
    nullable: true,
  })
  viewingPlaceType!: ViewingPlaceType | null;
  
  @ApiPropertyOptional({
    description: "집에서 영화를 본 플랫폼",
    enum: ViewingPlatform,
    example: ViewingPlatform.NETFLIX,
    nullable: true,
  })
  viewingPlatform!: ViewingPlatform | null;

  @ApiPropertyOptional({
    description: "기타 플랫폼을 선택했을 때 입력한 플랫폼명",
    example: "쿠팡플레이",
    nullable: true,
    maxLength: 100,
  })
  viewingPlatformCustom!: string | null;

  @ApiPropertyOptional({
    description: "관람 장소 정보",
    type: VenueSummaryResponseDto,
    nullable: true,
  })
  venue!: VenueSummaryResponseDto | null;
}
