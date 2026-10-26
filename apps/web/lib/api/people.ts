import {apiClient} from "./apiClient";

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
  tmdbPersonId: string | null;
  name: string;
  nameEn: string | null;
  profileUrl: string | null;
  biography: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  nationality: string | null;
  credits: PersonCredit[];
};

export async function enrichPersonFromTmdb(
  personId: string,
  tmdbPersonId: number,
): Promise<PersonDetail> {
  const { data } = await apiClient.post<PersonDetail>(
    `/people/${personId}/enrich/tmdb/${tmdbPersonId}`,
  );

  return data;
}

export async function getPerson(
  personId: string,
  signal?: AbortSignal,
): Promise<PersonDetail> {
  const { data } = await apiClient.get<PersonDetail>(`/people/${personId}`, {
    signal,
  });

  return data;
}
export type PersonBookmarkResponse = {
  personId: string;
  bookmarked: boolean;
};

export async function getPersonBookmark(
  personId: string,
  signal?: AbortSignal,
): Promise<PersonBookmarkResponse> {
  const { data } = await apiClient.get<PersonBookmarkResponse>(
    `/people/${personId}/bookmark`,
    { signal },
  );

  return data;
}

export async function addPersonBookmark(
  personId: string,
): Promise<PersonBookmarkResponse> {
  const { data } = await apiClient.post<PersonBookmarkResponse>(
    `/people/${personId}/bookmark`,
  );

  return data;
}

export async function removePersonBookmark(
  personId: string,
): Promise<PersonBookmarkResponse> {
  const { data } = await apiClient.delete<PersonBookmarkResponse>(
    `/people/${personId}/bookmark`,
  );

  return data;
}

export type PersonRole='DIRECTOR' | 'ACTOR';

export type BookmarkedPerson = {
  id: string;
  createdAt: string;
  person: {
    id: string;
    name: string;
    nameEn: string | null;
    profileUrl: string | null;
    roles: PersonRole[];
  };
};

export async function getBookmarkedPeople(
  signal?: AbortSignal,
): Promise<BookmarkedPerson[]> {
  const { data } = await apiClient.get<BookmarkedPerson[]>("/people/bookmarks", {
    signal,
  });

  return data;
}
