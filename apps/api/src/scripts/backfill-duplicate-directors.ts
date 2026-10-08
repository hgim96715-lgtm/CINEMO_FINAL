import "dotenv/config";

import { CreditType, Prisma, PrismaClient, SourceProvider } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const applyChanges = process.argv.includes("--apply");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL이 필요함");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const normalizeLatinName = (value: string | null | undefined) =>
  value
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim() ?? "";

const isSamePersonName = (
  left: { name: string; nameEn: string | null },
  right: { name: string; nameEn: string | null },
) => {
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

const hasProvider = (
  person: { providerLinks: { sourceProvider: SourceProvider }[] },
  sourceProvider: SourceProvider,
) => person.providerLinks.some((link) => link.sourceProvider === sourceProvider);

async function mergeDuplicateCredit(
  movieId: string,
  duplicateCreditId: string,
  duplicatePersonId: string,
  canonicalPersonId: string,
) {
  await prisma.$transaction(async (tx) => {
    const canonicalCredit = await tx.movieCredit.findUnique({
      where: {
        movieId_personId_creditType: {
          movieId,
          personId: canonicalPersonId,
          creditType: CreditType.DIRECTOR,
        },
      },
    });

    if (canonicalCredit) {
      await tx.movieCredit.delete({ where: { id: duplicateCreditId } });
    } else {
      await tx.movieCredit.update({
        where: { id: duplicateCreditId },
        data: { personId: canonicalPersonId },
      });
    }

    await tx.moviePersonProviderLink.updateMany({
      where: { personId: duplicatePersonId },
      data: { personId: canonicalPersonId },
    });

    const [remainingCredits, remainingLinks] = await Promise.all([
      tx.movieCredit.count({ where: { personId: duplicatePersonId } }),
      tx.moviePersonProviderLink.count({
        where: { personId: duplicatePersonId },
      }),
    ]);

    if (remainingCredits === 0 && remainingLinks === 0) {
      await tx.moviePerson.delete({ where: { id: duplicatePersonId } });
    }
  });
}

async function main() {
  const movies = await prisma.movie.findMany({
    where: {
      movieCredits: {
        some: { creditType: CreditType.DIRECTOR },
      },
    },
    select: { id: true },
  });

  let inspected = 0;
  let candidates = 0;
  let merged = 0;

  for (const movie of movies) {
    const credits = await prisma.movieCredit.findMany({
      where: {
        movieId: movie.id,
        creditType: CreditType.DIRECTOR,
      },
      include: {
        person: {
          include: { providerLinks: true },
        },
      },
    });

    inspected += credits.length;

    const linkedKobisCredits = credits.filter((credit) =>
      hasProvider(credit.person, SourceProvider.KOBIS),
    );

    const canonicalCredits =
      linkedKobisCredits.length > 0
        ? linkedKobisCredits
        : [...credits].sort(
            (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
          ).slice(0, 1);

    for (const duplicateCredit of credits) {
      const canonicalCredit = canonicalCredits.find(
        (candidate) =>
          candidate.person.id !== duplicateCredit.person.id &&
          isSamePersonName(candidate.person, duplicateCredit.person),
      );

      if (!canonicalCredit) {
        continue;
      }

      candidates += 1;
      console.log(
        `[${applyChanges ? "APPLY" : "DRY-RUN"}] ${movie.id} ` +
          `${linkedKobisCredits.length > 0 ? "KOBIS-LINK" : "LEGACY-ORDER"}: ` +
          `${duplicateCredit.person.name} -> ${canonicalCredit.person.name}`,
      );

      if (applyChanges) {
        await mergeDuplicateCredit(
          movie.id,
          duplicateCredit.id,
          duplicateCredit.person.id,
          canonicalCredit.person.id,
        );
        merged += 1;
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: applyChanges ? "apply" : "dry-run",
        movies: movies.length,
        inspected,
        candidates,
        merged,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
