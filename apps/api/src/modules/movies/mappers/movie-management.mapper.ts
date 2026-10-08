import { MediaType, TitleType } from "@prisma/client";

import type {
  MovieSearchWithDetails,
} from "../repositories/movies.repository";

type ManagementMovie = Pick<
  MovieSearchWithDetails,
  "id" | "visibility" | "moderationReason" | "titles" | "releases" | "media"
>;

export const toMovieManagementItem = (movie: ManagementMovie) => ({
  id: movie.id,
  title:
    movie.titles.find((title) => title.titleType === TitleType.PRIMARY)?.title ??
    movie.titles[0]?.title ??
    "",
  visibility: movie.visibility,
  moderationReason: movie.moderationReason,
  releaseDate: movie.releases[0]?.releaseDate ?? null,
  posterUrl:
    movie.media.find((media) => media.mediaType === MediaType.POSTER)?.url ??
    null,
});
