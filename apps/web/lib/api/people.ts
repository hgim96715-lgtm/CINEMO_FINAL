import { apiClient } from "./apiClient";

export type PersonMovie = {
  id: string;
  title: string;
  releaseDate: string | null;
  posterUrl: string | null;
};

export type PersonCredit = {
  id: string;
  personId: string;
  creditType: "DIRECTOR" | "ACTOR";
  characterName: string | null;
  displayOrder: number | null;
  movie: PersonMovie;
};

export type PersonDetail = {
  id: string;
  name: string;
  nameEn: string | null;
  profileUrl: string | null;
  biography: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  nationality: string | null;
  credits: PersonCredit[];
};

export async function getPerson(
  personId: string,
  signal?: AbortSignal,
): Promise<PersonDetail> {
  const { data } = await apiClient.get<PersonDetail>(`/people/${personId}`, {
    signal,
  });

  return data;
}
