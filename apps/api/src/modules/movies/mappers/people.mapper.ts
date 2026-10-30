import {MediaType, SourceProvider, TitleType} from "@prisma/client";

import type {PersonDetailResponseDto} from "../dto/responses/person-detail.response.dto";
import type {PersonWithDetails} from "../repositories/people.repository";
import type {BookmarkedPersonWithRoles,} from "../repositories/user-person-bookmark.repository";

type PersonMovieTitles = PersonWithDetails["credits"][number]["movie"]["titles"];

function selectKoreanMovieTitle(titles: PersonMovieTitles) {
  return (
    titles.find(
      (title) =>
        title.titleType === TitleType.PRIMARY && /[가-힣]/.test(title.title),
    )?.title ??
    titles.find((title) => /[가-힣]/.test(title.title))?.title ??
    null
  );
}

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
  credits: person.credits.flatMap((credit) => {
    const title = selectKoreanMovieTitle(credit.movie.titles);
    const releaseDate = credit.movie.releases[0]?.releaseDate ?? null;

    const posterUrl =
      credit.movie.media.find((media) => media.mediaType === MediaType.POSTER)
        ?.url ?? null;

    if (!title || !releaseDate || !posterUrl) {
      return [];
    }

    return [{
      id: credit.id,
      personId: credit.personId,
      creditType: credit.creditType,
      characterName: credit.characterName,
      displayOrder: credit.displayOrder,
      movie: {
        id: credit.movie.id,
        title,
        releaseDate,
        posterUrl,
      },
    }];
  }),
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
