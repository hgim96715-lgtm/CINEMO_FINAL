import "dotenv/config";

import { CurationStatus, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL이 필요함");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const curations = [
  {
    slug: "student-independence-movement-day",
    eyebrow: "11월 3일 학생독립운동 기념일",
    title: "학생독립운동 기념일에 함께 보는 영화",
    description: "일제강점기 학생들의 독립운동 정신을 기억하는 영화",
    startsAt: "2026-11-02T00:00:00+09:00",
    endsAt: "2026-11-03T23:59:59.999+09:00",
    sortOrder: 0,
    movies: [
      { title: "동주", reason: "" },
      { title: "박열", reason: "" },
      { title: "항거", reason: "" },
    ],
  },
  {
    slug: "firefighters-day",
    eyebrow: "11월 9일 소방의 날",
    title: "소방의 날, 기억하고 감사하는 영화",
    description: "화재와 재난 현장에서 사람들을 지켜온 소방관들의 노고를 기억하는 영화",
    startsAt: "2026-11-08T00:00:00+09:00",
    endsAt: "2026-11-09T23:59:59.999+09:00",
    sortOrder: 0,
    movies: [
      { title: "소방관", reason: "" },
      { title: "엑시트", reason: "" },
      { title: "타워", reason: "" },
    ],
  },
] as const;

async function main() {
  for (const curation of curations) {
    const movies = await Promise.all(
      curation.movies.map(async (movie) => {
        const foundMovie = await prisma.movie.findFirst({
          where: {
            titles: {
              some: { title: { contains: movie.title } },
            },
          },
          select: { id: true },
        });

        if (!foundMovie) {
          throw new Error(`영화를 찾을 수 없음: ${movie.title}`);
        }

        return { movieId: foundMovie.id, reason: movie.reason };
      }),
    );

    await prisma.curation.upsert({
      where: { slug: curation.slug },
      create: {
        slug: curation.slug,
        eyebrow: curation.eyebrow,
        title: curation.title,
        description: curation.description,
        status: CurationStatus.PUBLISHED,
        startsAt: new Date(curation.startsAt),
        endsAt: new Date(curation.endsAt),
        sortOrder: curation.sortOrder,
        movies: {
          create: movies.map((movie, sortOrder) => ({
            movieId: movie.movieId,
            reason: movie.reason,
            sortOrder,
          })),
        },
      },
      update: {
        eyebrow: curation.eyebrow,
        title: curation.title,
        description: curation.description,
        status: CurationStatus.PUBLISHED,
        startsAt: new Date(curation.startsAt),
        endsAt: new Date(curation.endsAt),
        sortOrder: curation.sortOrder,
        movies: {
          deleteMany: {},
          create: movies.map((movie, sortOrder) => ({
            movieId: movie.movieId,
            reason: movie.reason,
            sortOrder,
          })),
        },
      },
    });

    console.log(`큐레이션 등록 완료: ${curation.title}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
