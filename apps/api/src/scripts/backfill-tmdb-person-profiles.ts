import "dotenv/config";

import axios from "axios";
import { PrismaClient, SourceProvider } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import type { TmdbPersonDetailResponse } from "../integrations/tmdb/types/tmdb-response.type";

const applyChanges = process.argv.includes("--apply");
const databaseUrl = process.env.DATABASE_URL;
const tmdbBaseUrl = process.env.TMDB_BASE_URL?.replace(/\/$/, "");
const tmdbAccessToken = process.env.TMDB_ACCESS_TOKEN;

if (!databaseUrl || !tmdbBaseUrl || !tmdbAccessToken) {
  throw new Error("DATABASE_URL, TMDB_BASE_URL, TMDB_ACCESS_TOKEN이 필요함");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const toDate = (value: string | null): Date | null => {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toProfileUrl = (profilePath: string | null): string | null =>
  profilePath ? `https://image.tmdb.org/t/p/w500${profilePath}` : null;

const toUpdateData = (person: TmdbPersonDetailResponse) => {
  const biography = person.biography?.trim() || null;
  const birthPlace = person.place_of_birth?.trim() || null;
  const profileUrl = toProfileUrl(person.profile_path);
  const birthDate = toDate(person.birthday);

  return {
    ...(profileUrl ? { profileUrl } : {}),
    ...(biography ? { biography } : {}),
    ...(birthDate ? { birthDate } : {}),
    ...(birthPlace ? { birthPlace } : {}),
  };
};

async function main() {
  const targets = await prisma.moviePersonProviderLink.findMany({
    where: {
      sourceProvider: SourceProvider.TMDB,
      person: {
        OR: [
          { profileUrl: null },
          { biography: null },
          { birthDate: null },
          { birthPlace: null },
        ],
      },
    },
    select: {
      personId: true,
      externalId: true,
      person: {
        select: {
          name: true,
          nameEn: true,
        },
      },
    },
    orderBy: {
      externalId: "asc",
    },
  });

  let updated = 0;
  let skipped = 0;
  const failures: Array<{
    personId: string;
    tmdbPersonId: string;
    message: string;
  }> = [];

  for (const target of targets) {
    const tmdbPersonId = Number(target.externalId);

    if (!Number.isInteger(tmdbPersonId) || tmdbPersonId < 1) {
      skipped += 1;
      failures.push({
        personId: target.personId,
        tmdbPersonId: target.externalId,
        message: "TMDB 인물 식별자가 올바르지 않음",
      });
      continue;
    }

    try {
      const { data } = await axios.get<TmdbPersonDetailResponse>(
        `${tmdbBaseUrl}/person/${tmdbPersonId}`,
        {
          headers: {
            Authorization: `Bearer ${tmdbAccessToken}`,
          },
          params: {
            language: "ko-KR",
          },
        },
      );

      const updateData = toUpdateData(data);

      if (Object.keys(updateData).length === 0) {
        skipped += 1;
        continue;
      }

      console.log(
        `[${applyChanges ? "APPLY" : "DRY-RUN"}] ${target.personId} ` +
          `${target.person.name} (${target.person.nameEn ?? "영문명 없음"})`,
      );

      if (applyChanges) {
        await prisma.moviePerson.update({
          where: { id: target.personId },
          data: updateData,
        });
      }

      updated += 1;
    } catch (error) {
      failures.push({
        personId: target.personId,
        tmdbPersonId: target.externalId,
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    }

    await wait(250);
  }

  console.log(
    JSON.stringify(
      {
        mode: applyChanges ? "apply" : "dry-run",
        inspected: targets.length,
        updated,
        skipped,
        failed: failures.length,
        failures,
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
