import {ApiProperty} from "@nestjs/swagger";
import {
  PostcardQuoteSource,
  PostcardSource,
  PostcardStatus,
  PostcardType,
  PostcardVisibility,
} from "@prisma/client";
import type {PostcardMetadataDto} from "../requests/postcard-metadata.dto";
import type {PostcardStyleDto} from "../requests/postcard-style.dto";

export class PostcardMovieSummaryDto {
  @ApiProperty({ description: "영화 ID", format: "uuid" })
  id!: string;

  @ApiProperty({ description: "대표 영화 제목", example: "인터스텔라" })
  title!: string;

  @ApiProperty({
    description: "대표 포스터 URL",
    type: String,
    nullable: true,
    example: "https://image.tmdb.org/t/p/w342/example.jpg",
  })
  posterUrl!: string | null;
}

export class PostcardMediaResponseDto {
  @ApiProperty({ description: "엽서 이미지 ID", format: "uuid" })
  id!: string;

  @ApiProperty({ description: "엽서 미디어 유형", example: "IMAGE" })
  type!: string;

  @ApiProperty({ type: String, nullable: true })
  url!: string | null;

  @ApiProperty({ type: String, nullable: true })
  storageKey!: string | null;

  @ApiProperty({ type: String, nullable: true })
  altText!: string | null;

  @ApiProperty({ description: "이미지 정렬 순서", example: 0 })
  sortOrder!: number;
}

export class PostcardAuthorSummaryDto {
  @ApiProperty({ description: "작성자 닉네임", example: "시네마틱" })
  nickname!: string;
}

export class PostcardResponseDto {
  @ApiProperty({
    description: "엽서 ID",
    format: "uuid",
  })
  id!: string;
  
  @ApiProperty({
    description: "영화 ID",
    format: "uuid",
  })
  movieId!: string;

  @ApiProperty({
    description: "피드 카드에 표시할 영화 요약 정보",
    type: PostcardMovieSummaryDto,
    nullable: true,
  })
  movie!: PostcardMovieSummaryDto | null;

  @ApiProperty({
    description: "엽서를 작성한 사용자 요약 정보",
    type: PostcardAuthorSummaryDto,
    nullable: true,
  })
  author!: PostcardAuthorSummaryDto | null;

  @ApiProperty({
    description: "엽서에 직접 첨부한 이미지 목록",
    type: [PostcardMediaResponseDto],
  })
  media!: PostcardMediaResponseDto[];
  
  @ApiProperty({
    description: "엽서 유형",
    enum: PostcardType,
    example: PostcardType.REVIEW,
  })
  type!: PostcardType;
  
  @ApiProperty({
    description: "엽서 생성 방식",
    enum: PostcardSource,
    example: PostcardSource.USER,
  })
  source!: PostcardSource;

  @ApiProperty({
    description: "QUOTE 원문의 근거",
    enum: PostcardQuoteSource,
    nullable: true,
  })
  quoteSource!: PostcardQuoteSource | null;
  
  @ApiProperty({
    description: "엽서 내용",
    example: "영화를 보고 난 뒤 오래 남은 장면",
  })
  content!: string;
  
  @ApiProperty({
    description: "엽서 배경 스타일",
    type: String,
    nullable: true,
    example: "midnight",
  })
  backgroundStyle!: string | null;

  @ApiProperty({
    description: "Cloud Storage 배경 이미지 식별자",
    type: String,
    nullable: true,
    example: "postcards/backgrounds/01.webp",
  })
  backgroundImageKey!: string | null;

  @ApiProperty({
    description: "엽서 유형별 추가 기록 정보",
    type: Object,
    nullable: true,
  })
  metadata!: PostcardMetadataDto | null;

  @ApiProperty({
    description: "엽서 스타일 정보",
    type: Object,
    nullable: true,
  })
  style!: PostcardStyleDto | null;

  @ApiProperty({ description: "이모지 반응 수", example: 12 })
  reactionCount!: number;

  @ApiProperty({ description: "댓글 수", example: 4 })
  commentCount!: number;

  @ApiProperty({ description: "공유 수", example: 2 })
  shareCount!: number;
  
  @ApiProperty({
    description: "엽서 공개 상태",
    enum: PostcardVisibility,
    example: PostcardVisibility.PUBLIC,
  })
  visibility!: PostcardVisibility;
  
  @ApiProperty({
    description: "엽서 처리 상태",
    enum: PostcardStatus,
    example: PostcardStatus.DRAFT,
  })
  status!: PostcardStatus;
  
  @ApiProperty({
    description: "생성 시각",
    type: String,
    format: "date-time",
  })
  createdAt!: string;
  
  @ApiProperty({
    description: "수정 시각",
    type: String,
    format: "date-time",
  })
  updatedAt!: string;
}
