import { apiClient } from "./apiClient";

export type AdminMovieVisibility = "PUBLIC" | "REVIEW" | "HIDDEN";
export type TheaterExclusive = "CGV" | "MEGABOX" | "LOTTE_CINEMA";

export type AdminMovieVisibilityFilter = AdminMovieVisibility | "ALL";

export type AdminMovie = {
  id: string;
  title: string;
  visibility: AdminMovieVisibility;
  moderationReason: string | null;
  releaseDate: string | null;
  theaterExclusive: TheaterExclusive | null;
  rereleaseDate: string | null;
  rereleaseTheaterExclusive: TheaterExclusive | null;
  posterUrl: string | null;
};

export type AdminMoviesResponse = {
  items: AdminMovie[];
  totalCount: number;
  page: number;
  limit: number;
  visibility: AdminMovieVisibilityFilter;
};

export async function searchAdminMovies(params: {
  query: string;
  visibility: AdminMovieVisibilityFilter;
  page?: number;
  limit?: number;
}): Promise<AdminMoviesResponse> {
  const { data } = await apiClient.get<AdminMoviesResponse>(
    "/admin/movies/moderation",
    {
      params: {
        query: params.query,
        visibility: params.visibility,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
    },
  );

  return data;
}

export async function updateAdminMovieVisibility(input: {
  movieId: string;
  visibility: AdminMovieVisibility;
  moderationReason?: string | null;
}) {
  await apiClient.patch(
    `/admin/movies/${encodeURIComponent(input.movieId)}/visibility`,
    {
      visibility: input.visibility,
      moderationReason: input.moderationReason ?? null,
    },
  );
}

export async function createAdminMovieRerelease(input: {
  movieId: string;
  releaseDate: string;
}) {
  await apiClient.post(
    `/admin/movies/${encodeURIComponent(input.movieId)}/rereleases`,
    {
      releaseDate: input.releaseDate,
    },
  );
}

export async function updateAdminMovieRereleaseFormat(input: {
  movieId: string;
  theaterExclusive: TheaterExclusive | null;
}) {
  await apiClient.patch(
    `/admin/movies/${encodeURIComponent(input.movieId)}/rereleases/format`,
    {
      theaterExclusive: input.theaterExclusive,
    },
  );
}
