import {MediaType, SourceProvider, TitleType} from "@prisma/client";

import type {PersonDetailResponseDto} from "../dto/responses/person-detail.response.dto";
import type {PersonWithDetails} from "../repositories/people.repository";
import type {BookmarkedPersonWithRoles,} from "../repositories/user-person-bookmark.repository";

export const toPersonDetailResponse = (
  person: PersonWithDetails,
): PersonDetailResponseDto => ({
  id: person.id,
  tmdbPersonId:
    person.providerLinks.find(
      (link) => link.sourceProvider === SourceProvider.TMDB,
    )?.externalId ?? null,
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
            (title) =>
              title.titleType === TitleType.PRIMARY &&
              title.languageCode?.toLowerCase().startsWith("ko") &&
              /[가-힣]/.test(title.title),
          )?.title ??
          credit.movie.titles.find(
            (title) =>
              title.languageCode?.toLowerCase().startsWith("ko") &&
              /[가-힣]/.test(title.title),
          )?.title ??
          credit.movie.titles.find((title) => /[가-힣]/.test(title.title))
            ?.title ??
          "",
      releaseDate: credit.movie.releases[0]?.releaseDate ?? null,
      posterUrl:
        credit.movie.media.find((media) => media.mediaType === MediaType.POSTER)
          ?.url ?? null,
    },
  })),
});

export const toBookmarkedPeopleResponse = (
    bookmarks: BookmarkedPersonWithRoles[],
) =>
    bookmarks.map(({ id, createdAt, person }) => ({
      id,
      createdAt,
      person: {
        id: person.id,
        name: person.name,
        nameEn: person.nameEn,
        profileUrl: person.profileUrl,
        roles: [...new Set(person.credits.map((credit) => credit.creditType))],
      },
    }));
