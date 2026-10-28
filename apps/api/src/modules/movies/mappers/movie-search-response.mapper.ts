import { MediaType } from "@prisma/client";
import { MovieSearchItemResponseDto } from "../dto/responses/movie-search-item.response.dto";
import { MovieSearchWithDetails } from "../repositories/movies.repository";

type MovieRankingData = {
  rankChange: number | null;
  audienceCount: number | null;
  totalAudienceCount: number | null;
};

export function toMovieSearchItemResponseDto(
  movie: MovieSearchWithDetails,
  rank: number | null = null,
  ranking?: MovieRankingData,
): MovieSearchItemResponseDto {
  const koreanTitle =
    movie.titles.find(
      (item) =>
        item.titleType === "PRIMARY" &&
        item.languageCode?.toLocaleLowerCase().startsWith("ko") &&
        /[가-힣]/.test(item.title),
    ) ??
    movie.titles.find(
      (item) =>
        item.languageCode?.toLocaleLowerCase().startsWith("ko") &&
        /[가-힣]/.test(item.title),
    ) ??
    movie.titles.find((item) => /[가-힣]/.test(item.title));

  const originalTitle = movie.titles.find(
    (item) => item.titleType === "ORIGINAL",
  );
  const hasKoreanRelease = movie.releases.some(
    (release) => release.countryCode === "KR",
  );
  const title = hasKoreanRelease
    ? koreanTitle ?? originalTitle
    : originalTitle ?? koreanTitle;

  const release =
    movie.releases.find((item) => item.isPrimary) ?? movie.releases[0];

  const poster =
    movie.media.find((item) => item.mediaType === "POSTER" && item.isPrimary) ??
    movie.media.find((item) => item.mediaType === "POSTER");

  const isAdultOnly = movie.movieCertifications.some((certification) => {
    const normalizedCertification = certification.watchGradeName.replace(
      /\s/g,
      "",
    );

    return (
      normalizedCertification.includes("청소년관람불가") ||
      normalizedCertification.includes("19세")
    );
  });

  return {
    id: movie.id,
    title: title?.title ?? "",
    releaseDate: release?.releaseDate
      ? release.releaseDate.toISOString().slice(0, 10)
      : null,
    posterUrl: poster?.url ?? null,
    hasTrailer: movie.media.some(
      (media) => media.mediaType === MediaType.TRAILER,
    ),
    genres: movie.movieGenres.map((genre) => genre.name),
    isAdultOnly,
    rank,
    rankChange: ranking?.rankChange ?? null,
    audienceCount: ranking?.audienceCount ?? null,
    totalAudienceCount: ranking?.totalAudienceCount ?? null,
  };
}
