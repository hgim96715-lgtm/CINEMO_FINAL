import { TitleType } from "@prisma/client";

import type { CurationWithMovies } from "./curation.repository";
import { CurationResponseDto } from "./dto/responses/curation.response.dto";

function isKoreanTitle(title: { title: string; languageCode: string | null }) {
  return (
    /[가-힣]/.test(title.title) ||
    title.languageCode?.toLowerCase().startsWith("ko") === true
  );
}

function selectMovieTitle(
  titles: CurationWithMovies["movies"][number]["movie"]["titles"],
) {
  return (
    titles.find(
      (title) => title.titleType === TitleType.PRIMARY && isKoreanTitle(title),
    ) ??
    titles.find((title) => isKoreanTitle(title)) ??
    titles.find((title) => title.titleType === TitleType.PRIMARY) ??
    titles.find((title) => title.titleType === TitleType.ORIGINAL) ??
    titles[0]
  );
}

export function toCurationResponseDto(
  curation: CurationWithMovies,
): CurationResponseDto {
  return {
    id: curation.id,
    slug: curation.slug,
    eyebrow: curation.eyebrow,
    title: curation.title,
    description: curation.description,
    status: curation.status,
    startsAt: curation.startsAt?.toISOString() ?? null,
    endsAt: curation.endsAt?.toISOString() ?? null,
    sortOrder: curation.sortOrder,
    movies: curation.movies.map((item) => {
      const title = selectMovieTitle(item.movie.titles);
      const poster = item.movie.media[0];
      const release = item.movie.releases[0];

      return {
        id: item.movie.id,
        title: title?.title ?? "제목 없음",
        posterUrl: poster?.url ?? null,
        releaseDate: release?.releaseDate
          ? release.releaseDate.toISOString().slice(0, 10)
          : null,
        reason: item.reason,
        sortOrder: item.sortOrder,
      };
    }),
    createdAt: curation.createdAt.toISOString(),
    updatedAt: curation.updatedAt.toISOString(),
  };
}
