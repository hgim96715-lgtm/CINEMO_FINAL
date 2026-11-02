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
    title: "붓 대신 들었던 함성, 11월 3일을 기억하며",
    description: "일제강점기, 학생들이 거리로 나와 자유를 외쳤던 날을 기억하는 영화",
    startsAt: "2026-11-02T00:00:00+09:00",
    endsAt: "2026-11-03T23:59:59.999+09:00",
    sortOrder: 0,
    movies: [
      { title: "동주", reason: "시와 글로 시대의 어둠에 맞선 윤동주와 송몽규의 이야기" },
      { title: "박열", reason: "일제에 맞선 박열과 가네코 후미코의 뜨거운 저항" },
      { title: "항거", reason: "서대문형무소에서 끝까지 저항한 유관순의 이야기" },
    ],
  },
  {
    slug: "firefighters-day",
    eyebrow: "11월 9일 소방의 날",
    title: "불길 속으로 걸어간 사람들을 기억하며",
    description: "화재와 재난 현장에서 사람들을 지켜온 소방관들의 노고를 기억하는 영화",
    startsAt: "2026-11-08T00:00:00+09:00",
    endsAt: "2026-11-09T23:59:59.999+09:00",
    sortOrder: 0,
    movies: [
      { title: "소방관", reason: "누군가의 오늘을 지키기 위해 위험 속으로 뛰어든 사람들의 이야기" },
      { title: "엑시트", reason: "재난 속에서 서로를 구하며 끝까지 탈출구를 찾는 이야기" },
      { title: "타워", reason: "초고층 화재 속에서 사람들을 살리기 위해 고군분투하는 사람들의 이야기" },
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
