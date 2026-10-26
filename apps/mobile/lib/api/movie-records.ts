import { apiClient } from "./apiClient";

export type ViewingPlaceType = "HOME" | "VENUE";

export type ViewingPlatform =
  | "NETFLIX"
  | "WATCHA"
  | "TVING"
  | "DISNEY_PLUS"
  | "WAVVE"
  | "APPLE_TV"
  | "PRIME_VIDEO"
  | "COUPANG_PLAY"
  | "TV"
  | "OTHER";

export type MovieRecord = {
  movieId: string;
  isFavorite: boolean;
  isWatched: boolean;
  watchedAt: string | null;
  rating: string | null;
  venueId: string | null;
  viewingPlaceType: ViewingPlaceType | null;
  viewingPlatform: ViewingPlatform | null;
  viewingPlatformCustom: string | null;
};

export type UpdateMovieRecordInput = {
  isFavorite?: boolean;
  isWatched?: boolean;
  watchedAt?: string | null;
  rating?: string | null;
  venueId?: string | null;
  viewingPlaceType?: ViewingPlaceType | null;
  viewingPlatform?: ViewingPlatform | null;
  viewingPlatformCustom?: string | null;
};

export async function getMovieRecord(
  movieId: string,
  signal?: AbortSignal,
): Promise<MovieRecord> {
  const response = await apiClient.get<MovieRecord>(
    `/movies/${movieId}/record`,
    { signal },
  );

  return response.data;
}

export async function updateMovieRecord(
  movieId: string,
  input: UpdateMovieRecordInput,
): Promise<MovieRecord> {
  const response = await apiClient.patch<MovieRecord>(
    `/movies/${movieId}/record`,
    input,
  );

  return response.data;
}

export async function deleteMovieRecord(movieId: string): Promise<void> {
  await apiClient.delete(`/movies/${movieId}/record`);
}
