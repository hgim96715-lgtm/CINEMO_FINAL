import { apiClient } from "./apiClient";

export type AdminMovieVisibility = "PUBLIC" | "REVIEW" | "HIDDEN";

export type AdminMovie = {
  id: string;
  title: string;
  visibility: AdminMovieVisibility;
  moderationReason: string | null;
  releaseDate: string | null;
  posterUrl: string | null;
};

export type AdminMoviesResponse = {
  items: AdminMovie[];
  totalCount: number;
  page: number;
  limit: number;
  visibility: AdminMovieVisibility;
};

export async function searchAdminMovies(params: {
  query: string;
  visibility: AdminMovieVisibility;
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
