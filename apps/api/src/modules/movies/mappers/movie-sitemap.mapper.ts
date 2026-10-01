import { MovieSitemapItemResponseDto } from "../dto/responses/movie-sitemap.response.dto";

type MovieSitemapSource = {
  id: string;
  updatedAt: Date;
};

// DB의 sitemap 영화 한 건을 API 응답 DTO 한 건으로 변환
export function toMovieSitemapItemResponseDto(
  movie: MovieSitemapSource,
): MovieSitemapItemResponseDto {
  return {
    id: movie.id,
    updatedAt: movie.updatedAt.toISOString(),
  };
}
