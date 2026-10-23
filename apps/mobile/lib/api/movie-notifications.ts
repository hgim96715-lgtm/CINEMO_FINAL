import { apiClient } from "@/lib/api/apiClient";

export type MovieNotificationStatus = {
  movieId: string;
  enabled: boolean;
  releaseDate: string | null;
};

export async function getMovieNotification(
  movieId: string,
  signal?: AbortSignal,
): Promise<MovieNotificationStatus> {
  const response = await apiClient.get<MovieNotificationStatus>(
    `/movies/${encodeURIComponent(movieId)}/notification`,
    {
      signal,
    },
  );
  return response.data;
}

export async function subscribeMovieNotification(
  movieId: string,
): Promise<MovieNotificationStatus> {
  const response = await apiClient.post<MovieNotificationStatus>(
    `/movies/${encodeURIComponent(movieId)}/notification`,
  );
  return response.data;
}

export async function unsubscribeMovieNotification(
  movieId: string,
): Promise<MovieNotificationStatus> {
  const response = await apiClient.delete<MovieNotificationStatus>(
    `/movies/${encodeURIComponent(movieId)}/notification`,
  );
  return response.data;
}
