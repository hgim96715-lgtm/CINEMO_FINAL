import { Injectable } from "@nestjs/common";
import { CreditType, Prisma, SourceProvider } from "@prisma/client";

import { MoviePersonRepository } from "./repositories/movie-person.repository";

interface ResolveMoviePersonInput {
  name: string;
  nameEn?: string | null;
  sourceProvider?: SourceProvider;
  externalId?: string | null;
  movieId?: string;
  creditType?: CreditType;
}

const normalizeLatinName = (value: string | null | undefined) =>
  value
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim() ?? "";

// KOBIS와 TMDB의 한글·영문 표기 차이로 동일 감독이 중복 생성되는 문제 방지
// 예: 곤살레스/곤잘레스, Alejandro G. Iñárritu/Alejandro Gonzalez Inarritu
// 동일 인물로 판단되면 KOBIS 인물을 대표 인물로 사용
const isSamePersonName = (
  left: { name: string; nameEn: string | null },
  right: { name: string; nameEn: string | null },
) => {
  const leftName = left.name.replace(/\s/g, "");
  const rightName = right.name.replace(/\s/g, "");

  if (leftName === rightName) {
    return true;
  }

  const leftTokens = normalizeLatinName(left.nameEn).split(" ").filter(Boolean);
  const rightTokens = normalizeLatinName(right.nameEn)
    .split(" ")
    .filter(Boolean);

  if (leftTokens.length < 2 || rightTokens.length < 2) {
    return false;
  }

  const sameFirstName = leftTokens[0] === rightTokens[0];
  const sameLastName = leftTokens.at(-1) === rightTokens.at(-1);
  const leftMiddle = leftTokens.slice(1, -1);
  const rightMiddle = rightTokens.slice(1, -1);
  const sameMiddleName =
    leftMiddle.length === 1 &&
    rightMiddle.length === 1 &&
    (leftMiddle[0] === rightMiddle[0] ||
      leftMiddle[0][0] === rightMiddle[0][0]);

  return sameFirstName && sameLastName && sameMiddleName;
};

@Injectable()
export class MoviePersonService {
  constructor(private readonly repository: MoviePersonRepository) {}

  async resolve(tx: Prisma.TransactionClient, input: ResolveMoviePersonInput) {
    const providerLink =
      input.sourceProvider && input.externalId
        ? await this.repository.findProviderLink(
            tx,
            input.sourceProvider,
            input.externalId,
          )
        : null;

    let matchedPerson = providerLink
      ? await this.repository.findByIdOrThrow(tx, providerLink.personId)
      : await this.repository.findByName(tx, input.name, input.nameEn);

    const originallyMatchedPersonId = matchedPerson?.id;

    // 같은 영화의 감독이 KOBIS와 TMDB에서 다른 표기로 들어온 경우
    // KOBIS 인물을 대표로 사용해 중복 인물·크레딧 생성을 방지
    if (
      input.movieId &&
      input.creditType === CreditType.DIRECTOR &&
      input.sourceProvider === SourceProvider.TMDB &&
      input.nameEn
    ) {
      const existingDirectors = await this.repository.findMovieDirectors(
        tx,
        input.movieId,
      );

      const matchingDirectors = existingDirectors
        .filter(
          (credit) =>
            credit.person.id !== matchedPerson?.id &&
            isSamePersonName(credit.person, {
              name: input.name,
              nameEn: input.nameEn ?? null,
            }),
        )
        .sort((left, right) => {
          const leftIsKobis = left.person.providerLinks.some(
            (link) => link.sourceProvider === SourceProvider.KOBIS,
          );
          const rightIsKobis = right.person.providerLinks.some(
            (link) => link.sourceProvider === SourceProvider.KOBIS,
          );

          if (leftIsKobis !== rightIsKobis) {
            return leftIsKobis ? -1 : 1;
          }

          return left.createdAt.getTime() - right.createdAt.getTime();
        });

      const kobisPerson = matchingDirectors[0]?.person;

      if (kobisPerson) {
        matchedPerson = kobisPerson;
      }
    }

    // KOBIS에서 축약된 감독명(예: "백")이 들어오고,
    // 같은 영화에 이미 TMDB 인물(예: "백종열")이 연결된 경우 재사용하는 오류 발견
    // 영화와 직무가 같고 후보가 하나일 때만 적용해 다른 인물을 잘못 합치지 않도록
    if (
      !matchedPerson &&
      input.movieId &&
      input.creditType === CreditType.DIRECTOR
    ) {
      const existingDirectors = await this.repository.findMovieDirectors(
        tx,
        input.movieId,
      );

      const candidate =
        existingDirectors.length === 1 ? existingDirectors[0].person : null;

      if (
        candidate &&
        candidate.name.length > input.name.length &&
        candidate.name.startsWith(input.name) &&
        candidate.providerLinks.some(
          (link) => link.sourceProvider === SourceProvider.TMDB,
        )
      ) {
        matchedPerson = candidate;
      }
    }

    const person = matchedPerson
      ? matchedPerson.nameEn || !input.nameEn
        ? matchedPerson
        : await this.repository.updateNameEn(
            tx,
            matchedPerson.id,
            input.nameEn,
          )
      : await this.repository.create(tx, input.name, input.nameEn);

    if (input.sourceProvider && input.externalId) {
      await this.repository.upsertProviderLink(
        tx,
        person.id,
        input.sourceProvider,
        input.externalId,
      );
    }

    if (
      originallyMatchedPersonId &&
      originallyMatchedPersonId !== person.id &&
      input.movieId &&
      input.creditType
    ) {
      await this.repository.deleteCredit(
        tx,
        input.movieId,
        originallyMatchedPersonId,
        input.creditType,
      );
    }

    return person;
  }
}
