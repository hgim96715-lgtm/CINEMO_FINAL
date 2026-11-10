import { MediaType, TitleType } from "@prisma/client";

import type { MovieSearchWithDetails } from "../repositories/movies.repository";

type ManagementMovie = Pick<
  MovieSearchWithDetails,
  "id" | "visibility" | "moderationReason" | "titles" | "releases" | "media"
>;

export const toMovieManagementItem = (movie: ManagementMovie) => {
  const latestKoreanRerelease = movie.releases.find(
    (release) =>
      release.countryCode === "KR" && release.releaseType === "RERELEASE",
  );

  return {
    id: movie.id,
    title:
      movie.titles.find((title) => title.titleType === TitleType.PRIMARY)
        ?.title ??
      movie.titles[0]?.title ??
      "",
    visibility: movie.visibility,
    moderationReason: movie.moderationReason,
    releaseDate: movie.releases[0]?.releaseDate ?? null,
    theaterExclusive: movie.releases[0]?.theaterExclusive ?? null,
    rereleaseDate: latestKoreanRerelease?.releaseDate ?? null,
    rereleaseTheaterExclusive:
      latestKoreanRerelease?.theaterExclusive ?? null,
    posterUrl:
      movie.media.find((media) => media.mediaType === MediaType.POSTER)?.url ??
      null,
  };
};
