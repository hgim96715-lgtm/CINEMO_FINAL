import { apiClient } from "./apiClient";

export type CurationMovie = {
  id: string;
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
  reason: string | null;
  sortOrder: number;
};

export type CurationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type Curation = {
  id: string;
  slug: string;
  eyebrow: string;
  title: string;
  description: string | null;
  status: CurationStatus;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  movies: CurationMovie[];
  createdAt: string;
  updatedAt: string;
};

export type SaveCurationInput = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string | null;
  status: CurationStatus;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  movies: Array<{
    movieId: string;
    reason: string | null;
    sortOrder: number;
  }>;
};

export async function getAdminCurations(): Promise<Curation[]> {
  const { data } = await apiClient.get<Curation[]>("/admin/curations");
  return data;
}

export async function createAdminCuration(
  input: SaveCurationInput,
): Promise<Curation> {
  const { data } = await apiClient.post<Curation>("/admin/curations", input);
  return data;
}

export async function updateAdminCuration(
  id: string,
  input: SaveCurationInput,
): Promise<Curation> {
  const { data } = await apiClient.patch<Curation>(
    `/admin/curations/${encodeURIComponent(id)}`,
    input,
  );
  return data;
}

export async function deleteAdminCuration(id: string): Promise<void> {
  await apiClient.delete(`/admin/curations/${encodeURIComponent(id)}`);
}

export async function getActiveCurations(): Promise<Curation[]> {
  const { data } = await apiClient.get<Curation[]>("/curations/active");
  return data;
}
