import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL이 필요하다.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const movieId = "0198f7a4-7b6e-7abc-8def-123456789abc";
const releaseId = "0198f7a4-7b6e-7abc-8def-123456789abd";
const titleId = "0198f7a4-7b6e-7abc-8def-123456789abe";
const mediaId = "0198f7a4-7b6e-7abc-8def-123456789abf";
const providerLinkId = "0198f7a4-7b6e-7abc-8def-123456789ac0";
const watchOptionId = "0198f7a4-7b6e-7abc-8def-123456789ac1";
const rankingId = "0198f7a4-7b6e-7abc-8def-123456789ac2";

async function main() {
  await prisma.movie.upsert({
    where: {
      id: movieId,
    },
    update: {},
    create: {
      id: movieId,
    },
  });

  await prisma.movieTitle.upsert({
    where: {
      id: titleId,
    },
    update: {},
    create: {
      id: titleId,
      movieId,
      title: "어벤져스: 엔드게임",
      titleType: "PRIMARY",
      languageCode: "ko",
    },
  });

  await prisma.movieRelease.upsert({
    where: {
      id: releaseId,
    },
    update: {},
    create: {
      id: releaseId,
      movieId,
      releaseDate: new Date("2019-04-24T00:00:00.000Z"),
      releaseType: "INITIAL",
      status: "RELEASED",
      countryCode: "KR",
      isPrimary: true,
    },
  });

  await prisma.movieMedia.upsert({
    where: {
      id: mediaId,
    },
    update: {},
    create: {
      id: mediaId,
      movieId,
      releaseId,
      mediaType: "POSTER",
      sourceProvider: "TMDB",
      url: "https://image.tmdb.org/t/p/w500/sample-poster.jpg",
      isPrimary: true,
      status: "ACTIVE",
    },
  });

  await prisma.movieProviderLink.upsert({
    where: {
      sourceProvider_externalId: {
        sourceProvider: "TMDB",
        externalId: "299534",
      },
    },
    update: {},
    create: {
      id: providerLinkId,
      movieId,
      sourceProvider: "TMDB",
      externalId: "299534",
      matchMethod: "AUTO",
      matchStatus: "APPROVED",
      confidence: 1,
    },
  });

  await prisma.movieWatchOption.upsert({
    where: {
      id: watchOptionId,
    },
    update: {},
    create: {
      id: watchOptionId,
      movieId,
      watchProvider: "DISNEY_PLUS",
      availabilityType: "STREAM",
      regionCode: "KR",
      url: "https://www.disneyplus.com/",
    },
  });

  await prisma.movieRankingSnapshot.upsert({
    where: {
      id: rankingId,
    },
    update: {},
    create: {
      id: rankingId,
      movieId,
      sourceProvider: "KOBIS",
      rank: 1,
      audienceCount: 13977602,
      collectedAt: new Date(),
    },
  });

  console.log(`영화 seed 완료: ${movieId}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
