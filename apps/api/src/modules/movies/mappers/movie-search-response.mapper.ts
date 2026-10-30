import { MediaType } from "@prisma/client";
import { MovieSearchItemResponseDto } from "../dto/responses/movie-search-item.response.dto";
import { MovieSearchWithDetails } from "../repositories/movies.repository";

type MovieRankingData = {
  rankChange: number | null;
  audienceCount: number | null;
  totalAudienceCount: number | null;
};

function isKoreanTitle(title: { title: string; languageCode: string | null }) {
  return (
    /[가-힣]/.test(title.title) ||
    title.languageCode?.toLocaleLowerCase().startsWith("ko") === true
  );
}

function selectDisplayTitle(
  titles: MovieSearchWithDetails["titles"],
) {
  return (
    titles.find(
      (item) => item.titleType === "PRIMARY" && isKoreanTitle(item),
    ) ??
    titles.find((item) => isKoreanTitle(item)) ??
    titles.find((item) => item.titleType === "PRIMARY") ??
    titles.find((item) => item.titleType === "ORIGINAL") ??
    titles[0]
  );
}

export function toMovieSearchItemResponseDto(
  movie: MovieSearchWithDetails,
  rank: number | null = null,
  ranking?: MovieRankingData,
): MovieSearchItemResponseDto {
  // 국내 극장 개봉작뿐 아니라 국내 OTT 공개작도 한국어 제목을 우선 노출함.
  // 언어 코드가 비어 있어도 실제 제목에 한글이 있으면 한국어 제목으로 취급함.
  const title = selectDisplayTitle(movie.titles);

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
