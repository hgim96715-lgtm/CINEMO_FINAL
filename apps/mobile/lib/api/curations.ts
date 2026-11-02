import { apiClient } from "./apiClient";

export type MobileCurationMovie = {
  id: string;
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
  reason: string | null;
  sortOrder: number;
};

export type MobileCuration = {
  id: string;
  slug: string;
  eyebrow: string;
  title: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  movies: MobileCurationMovie[];
};

export async function getActiveCurations(
  signal?: AbortSignal,
): Promise<MobileCuration[]> {
  const { data } = await apiClient.get<MobileCuration[]>("/curations/active", {
    signal,
  });

  return data;
}
