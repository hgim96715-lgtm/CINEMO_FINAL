import { Injectable } from "@nestjs/common";
import { Prisma, SourceProvider } from "@prisma/client";

interface ResolveMoviePersonInput {
  name: string;
  nameEn?: string | null;
  sourceProvider?: SourceProvider;
  externalId?: string | null;
}

@Injectable()
export class MoviePersonService {
  async resolve(
    tx: Prisma.TransactionClient,
    input: ResolveMoviePersonInput,
  ) {
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

    const matchedPerson = providerLink
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

    const person = matchedPerson
      ? await tx.moviePerson.update({
          where: { id: matchedPerson.id },
          data: {
            nameEn:
              matchedPerson.nameEn || !input.nameEn
                ? undefined
                : input.nameEn,
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
