import { Injectable } from "@nestjs/common";
import { CreditType, Prisma, SourceProvider } from "@prisma/client";

interface ResolveMoviePersonInput {
  name: string;
  nameEn?: string | null;
  sourceProvider?: SourceProvider;
  externalId?: string | null;
  movieId?: string;
  creditType?: CreditType;
}

@Injectable()
export class MoviePersonService {
  async resolve(tx: Prisma.TransactionClient, input: ResolveMoviePersonInput) {
    const providerLink =
      input.sourceProvider && input.externalId
        ? await tx.moviePersonProviderLink.findUnique({
            where: {
              sourceProvider_externalId: {
                sourceProvider: input.sourceProvider,
                externalId: input.externalId,
              },
            },
          })
        : null;

    let matchedPerson = providerLink
      ? await tx.moviePerson.findUniqueOrThrow({
          where: { id: providerLink.personId },
        })
      : await tx.moviePerson.findFirst({
          where: {
            OR: [
              { name: input.name },
              ...(input.nameEn ? [{ nameEn: input.nameEn }] : []),
            ],
          },
        });

    // KOBIS에서 축약된 감독명(예: "백")이 들어오고,
    // 같은 영화에 이미 TMDB 인물(예: "백종열")이 연결된 경우 재사용하는 오류 발견
    // 영화와 직무가 같고 후보가 하나일 때만 적용해 다른 인물을 잘못 합치지 않도록
    if (
      !matchedPerson &&
      input.movieId &&
      input.creditType === CreditType.DIRECTOR
    ) {
      const existingDirectors = await tx.movieCredit.findMany({
        where: {
          movieId: input.movieId,
          creditType: CreditType.DIRECTOR,
        },
        include: {
          person: {
            include: {
              providerLinks: true,
            },
          },
        },
      });

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
      ? await tx.moviePerson.update({
          where: { id: matchedPerson.id },
          data: {
            nameEn:
              matchedPerson.nameEn || !input.nameEn ? undefined : input.nameEn,
          },
        })
      : await tx.moviePerson.create({
          data: {
            name: input.name,
            nameEn: input.nameEn,
          },
        });

    if (input.sourceProvider && input.externalId) {
      await tx.moviePersonProviderLink.upsert({
        where: {
          sourceProvider_externalId: {
            sourceProvider: input.sourceProvider,
            externalId: input.externalId,
          },
        },
        create: {
          personId: person.id,
          sourceProvider: input.sourceProvider,
          externalId: input.externalId,
        },
        update: {
          personId: person.id,
        },
      });
    }

    return person;
  }
}
