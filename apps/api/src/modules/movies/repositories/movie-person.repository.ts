import { Injectable } from "@nestjs/common";
import { CreditType, Prisma, SourceProvider } from "@prisma/client";

@Injectable()
export class MoviePersonRepository {
  findProviderLink(
    tx: Prisma.TransactionClient,
    sourceProvider: SourceProvider,
    externalId: string,
  ) {
    return tx.moviePersonProviderLink.findUnique({
      where: {
        sourceProvider_externalId: {
          sourceProvider,
          externalId,
        },
      },
    });
  }

  findByIdOrThrow(tx: Prisma.TransactionClient, id: string) {
    return tx.moviePerson.findUniqueOrThrow({
      where: { id },
    });
  }

  findByName(
    tx: Prisma.TransactionClient,
    name: string,
    nameEn?: string | null,
  ) {
    return tx.moviePerson.findFirst({
      where: {
        OR: [{ name }, ...(nameEn ? [{ nameEn }] : [])],
      },
    });
  }

  findMovieDirectors(tx: Prisma.TransactionClient, movieId: string) {
    return tx.movieCredit.findMany({
      where: {
        movieId,
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
  }

  updateNameEn(tx: Prisma.TransactionClient, id: string, nameEn: string) {
    return tx.moviePerson.update({
      where: { id },
      data: { nameEn },
    });
  }

  create(tx: Prisma.TransactionClient, name: string, nameEn?: string | null) {
    return tx.moviePerson.create({
      data: {
        name,
        nameEn,
      },
    });
  }

  upsertProviderLink(
    tx: Prisma.TransactionClient,
    personId: string,
    sourceProvider: SourceProvider,
    externalId: string,
  ) {
    return tx.moviePersonProviderLink.upsert({
      where: {
        sourceProvider_externalId: {
          sourceProvider,
          externalId,
        },
      },
      create: {
        personId,
        sourceProvider,
        externalId,
      },
      update: {
        personId,
      },
    });
  }

  deleteCredit(
    tx: Prisma.TransactionClient,
    movieId: string,
    personId: string,
    creditType: CreditType,
  ) {
    return tx.movieCredit.deleteMany({
      where: {
        movieId,
        personId,
        creditType,
      },
    });
  }

  updateProfile(
    tx: Prisma.TransactionClient,
    personId: string,
    data: Prisma.MoviePersonUpdateInput,
  ) {
    return tx.moviePerson.update({
      where: {
        id: personId,
      },
      data: {
        ...(typeof data.profileUrl === "string"
          ? { profileUrl: data.profileUrl }
          : {}),
        ...(typeof data.biography === "string"
          ? { biography: data.biography }
          : {}),
        ...(data.birthDate instanceof Date ? { birthDate: data.birthDate } : {}),
        ...(typeof data.birthPlace === "string"
          ? { birthPlace: data.birthPlace }
          : {}),
        tmdbEnrichedAt: new Date(),
      },
    });
  }
}
