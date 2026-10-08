import { MediaType, TitleType } from "@prisma/client";

import type { PersonDetailResponseDto } from "../dto/responses/person-detail.response.dto";
import type { PersonWithDetails } from "../repositories/people.repository";

export const toPersonDetailResponse = (
  person: PersonWithDetails,
): PersonDetailResponseDto => ({
  id: person.id,
  name: person.name,
  nameEn: person.nameEn,
  profileUrl: person.profileUrl,
  biography: person.biography,
  birthDate: person.birthDate,
  birthPlace: person.birthPlace,
  nationality: person.nationality,
  credits: person.credits.map((credit) => ({
    id: credit.id,
    personId: credit.personId,
    creditType: credit.creditType,
    characterName: credit.characterName,
    displayOrder: credit.displayOrder,
    movie: {
      id: credit.movie.id,
      title:
        credit.movie.titles.find(
          (title) => title.titleType === TitleType.PRIMARY,
        )?.title ??
        credit.movie.titles[0]?.title ??
        "",
      releaseDate: credit.movie.releases[0]?.releaseDate ?? null,
      posterUrl:
        credit.movie.media.find((media) => media.mediaType === MediaType.POSTER)
          ?.url ?? null,
    },
  })),
});
