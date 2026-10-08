import type { TmdbPersonDetailResponse } from "@/integrations/tmdb/types/tmdb-response.type";

export type TmdbPersonProfileUpdate = {
  profileUrl: string | null;
  biography: string | null;
  birthDate: Date | null;
  birthPlace: string | null;
};

const parseBirthDate = (value: string | null): Date | null => {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const toTmdbPersonProfileUpdate = (
  person: TmdbPersonDetailResponse,
): TmdbPersonProfileUpdate => ({
  profileUrl: person.profile_path
    ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
    : null,
  biography: person.biography?.trim() || null,
  birthDate: parseBirthDate(person.birthday),
  birthPlace: person.place_of_birth?.trim() || null,
});
