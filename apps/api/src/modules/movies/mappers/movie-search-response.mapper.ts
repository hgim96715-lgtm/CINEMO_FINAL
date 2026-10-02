import { MovieSearchItemResponseDto } from "../dto/responses/movie-search-item.response.dto";
import { MovieSearchWithDetails } from "../movies.repository";

export function toMovieSearchItemResponseDto(
  movie: MovieSearchWithDetails,
  rank: number | null = null,
): MovieSearchItemResponseDto {
  const title =
    movie.titles.find((item) => item.titleType === "PRIMARY") ??
    movie.titles[0];

  const release =
    movie.releases.find((item) => item.isPrimary) ?? movie.releases[0];

  const poster =
    movie.media.find((item) => item.mediaType === "POSTER" && item.isPrimary) ??
    movie.media.find((item) => item.mediaType === "POSTER");

  return {
    id: movie.id,
    title: title?.title ?? "",
    releaseDate: release?.releaseDate
      ? release.releaseDate.toISOString().slice(0, 10)
      : null,
    posterUrl: poster?.url ?? null,
    genres: movie.movieGenres.map((genre) => genre.name),
    rank,
  };
}
