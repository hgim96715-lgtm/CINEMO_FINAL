import {ApiProperty} from "@nestjs/swagger";

export class MovieCalendarMovieResponseDto {
  @ApiProperty({
    description: "CINEMO 내부 영화 ID",
    example: "01a1164c-d39e-761d-8daf-95e15dd8adc8",
  })
  movieId!: string;
  
  @ApiProperty({
    description: "영화 제목",
    example: "돈 룩 업",
  })
  title!: string;
  
  @ApiProperty({
    description: "포스터 URL",
    example: "https://image.tmdb.org/t/p/w500/poster.jpg",
    nullable: true,
    type:String,
  })
  posterUrl!: string | null;
  
  @ApiProperty({
    description: "영화 장르",
    example: ["코미디", "드라마"],
    type: [String],
  })
  genres!: string[];
}

export class MovieCalendarDayResponseDto {
  @ApiProperty({
    description: "관람일",
    example: "2026-10-11",
  })
  date!: string;
  
  @ApiProperty({
    description: "해당 날짜에 관람한 영화 목록",
    type: [MovieCalendarMovieResponseDto],
  })
  movies!: MovieCalendarMovieResponseDto[];
}