import {NestFactory} from "@nestjs/core";
import {MatchStatus, ReleaseType, TitleType} from "@prisma/client";

const scriptArgs = process.argv.slice(2).filter((argument) => argument !== "--");
const confirmationRequested = scriptArgs.includes("--confirm");
const movieIds = scriptArgs.filter((argument) => argument !== "--confirm");
const KEEPER_MOVIE_ID =
  movieIds[0] ?? "01a12ea7-8917-70ff-be34-f86e3e504124";
const DUPLICATE_MOVIE_ID =
  movieIds[1] ?? "01a169d1-af6c-710a-9a0d-808557c2e0c0";

const hasSameDateAndCountry = (
  left: {releaseDate: Date | null; countryCode: string | null},
  right: {releaseDate: Date | null; countryCode: string | null},
) =>
  left.releaseDate?.getTime() === right.releaseDate?.getTime() &&
  left.countryCode === right.countryCode;

async function mergeMovieRecords() {
  if (!confirmationRequested) {
    throw new Error(
      "중복 영화 병합은 --confirm 옵션이 필요합니다. 데이터 삭제가 포함됩니다.",
    );
  }

  // --confirm 검증 후에만 DB 전용 모듈을 import해야 환경변수 검증이 실행됨.
  const [{MergeMovieAppModule}, {PrismaService}] = await Promise.all([
    import("../merge-movie-app.module.js"),
    import("../prisma/prisma.service.js"),
  ]);
  const app = await NestFactory.createApplicationContext(MergeMovieAppModule);
  const prisma = app.get(PrismaService);

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        if (KEEPER_MOVIE_ID === DUPLICATE_MOVIE_ID) {
          throw new Error("유지 영화와 중복 영화의 ID가 같습니다.");
        }

        const [keeper, duplicate] = await Promise.all([
          tx.movie.findUnique({
            where: {id: KEEPER_MOVIE_ID},
            select: {id: true},
          }),
          tx.movie.findUnique({
            where: {id: DUPLICATE_MOVIE_ID},
            select: {id: true},
          }),
        ]);

        if (!keeper || !duplicate) {
          throw new Error("병합할 영화 레코드를 찾을 수 없습니다.");
        }

        const protectedCounts = {
          postcards: await tx.postcard.count({
            where: {movieId: DUPLICATE_MOVIE_ID},
          }),
          postcardGenerations: await tx.postcardGeneration.count({
            where: {movieId: DUPLICATE_MOVIE_ID},
          }),
          postcardDailyUsages: await tx.postcardDailyUsage.count({
            where: {movieId: DUPLICATE_MOVIE_ID},
          }),
          userMovieRecords: await tx.userMovieRecord.count({
            where: {movieId: DUPLICATE_MOVIE_ID},
          }),
          userMovieNotifications: await tx.userMovieNotification.count({
            where: {movieId: DUPLICATE_MOVIE_ID},
          }),
        };

        const protectedRelations = Object.entries(protectedCounts).filter(
          ([, count]) => count > 0,
        );

        if (protectedRelations.length > 0) {
          throw new Error(
            `사용자 데이터가 있어 자동 병합을 중단합니다: ${protectedRelations
              .map(([name, count]) => `${name}=${count}`)
              .join(", ")}`,
          );
        }

        const duplicateLinks = await tx.movieProviderLink.findMany({
          where: {movieId: DUPLICATE_MOVIE_ID},
          select: {id: true, sourceProvider: true, externalId: true},
        });

        for (const link of duplicateLinks) {
          const existingLink = await tx.movieProviderLink.findUnique({
            where: {
              sourceProvider_externalId: {
                sourceProvider: link.sourceProvider,
                externalId: link.externalId,
              },
            },
            select: {id: true, movieId: true},
          });

          if (existingLink && existingLink.id !== link.id) {
            if (existingLink.movieId !== KEEPER_MOVIE_ID) {
              throw new Error(
                `provider link 충돌: ${link.sourceProvider}:${link.externalId}`,
              );
            }

            await tx.movieProviderLink.delete({where: {id: link.id}});
            continue;
          }

          await tx.movieProviderLink.update({
            where: {id: link.id},
            data: {
              movieId: KEEPER_MOVIE_ID,
              matchStatus: MatchStatus.APPROVED,
            },
          });
        }

        const [keeperReleases, duplicateReleases] = await Promise.all([
          tx.movieRelease.findMany({
            where: {movieId: KEEPER_MOVIE_ID},
            orderBy: {releaseDate: "asc"},
          }),
          tx.movieRelease.findMany({
            where: {movieId: DUPLICATE_MOVIE_ID},
            orderBy: {releaseDate: "asc"},
          }),
        ]);

        const releaseIdMap = new Map<string, string>();
        const initialKoreanRelease = keeperReleases.find(
          (release) =>
            release.releaseType === ReleaseType.INITIAL &&
            release.countryCode === "KR",
        );

        for (const release of duplicateReleases) {
          const existingRelease = keeperReleases.find((candidate) =>
            hasSameDateAndCountry(candidate, release),
          );

          if (existingRelease) {
            releaseIdMap.set(release.id, existingRelease.id);

            await tx.movieTitle.updateMany({
              where: {releaseId: release.id},
              data: {releaseId: existingRelease.id},
            });
            await tx.movieMedia.updateMany({
              where: {releaseId: release.id},
              data: {releaseId: existingRelease.id},
            });

            await tx.movieRelease.delete({where: {id: release.id}});
            continue;
          }

          const releaseType =
            release.countryCode === "KR" &&
            initialKoreanRelease?.releaseDate &&
            release.releaseDate?.getTime() !==
              initialKoreanRelease.releaseDate.getTime()
              ? ReleaseType.RERELEASE
              : release.releaseType;

          await tx.movieRelease.update({
            where: {id: release.id},
            data: {
              movieId: KEEPER_MOVIE_ID,
              releaseType,
              countryCode: release.countryCode ?? "KR",
              isPrimary: false,
            },
          });
          releaseIdMap.set(release.id, release.id);
          keeperReleases.push({...release, movieId: KEEPER_MOVIE_ID, releaseType});
        }

        const duplicateTitles = await tx.movieTitle.findMany({
          where: {movieId: DUPLICATE_MOVIE_ID},
        });

        for (const title of duplicateTitles) {
          const existingTitle = await tx.movieTitle.findFirst({
            where: {
              movieId: KEEPER_MOVIE_ID,
              title: title.title,
              languageCode: title.languageCode,
            },
            select: {id: true},
          });

          if (existingTitle) {
            await tx.movieTitle.delete({where: {id: title.id}});
            continue;
          }

          await tx.movieTitle.update({
            where: {id: title.id},
            data: {
              movieId: KEEPER_MOVIE_ID,
              releaseId: title.releaseId
                ? releaseIdMap.get(title.releaseId) ?? null
                : null,
              titleType:
                title.titleType === TitleType.PRIMARY
                  ? TitleType.ALIAS
                  : title.titleType,
            },
          });
        }

        const duplicateMedia = await tx.movieMedia.findMany({
          where: {movieId: DUPLICATE_MOVIE_ID},
          select: {id: true, releaseId: true},
        });

        for (const media of duplicateMedia) {
          await tx.movieMedia.update({
            where: {id: media.id},
            data: {
              movieId: KEEPER_MOVIE_ID,
              releaseId: media.releaseId
                ? releaseIdMap.get(media.releaseId) ?? null
                : null,
            },
          });
        }

        await tx.movieWatchOption.updateMany({
          where: {movieId: DUPLICATE_MOVIE_ID},
          data: {movieId: KEEPER_MOVIE_ID},
        });
        await tx.movieRankingSnapshot.updateMany({
          where: {movieId: DUPLICATE_MOVIE_ID},
          data: {movieId: KEEPER_MOVIE_ID},
        });
        await tx.moviePopularitySnapshot.updateMany({
          where: {movieId: DUPLICATE_MOVIE_ID},
          data: {movieId: KEEPER_MOVIE_ID},
        });
        await tx.movieCertification.updateMany({
          where: {movieId: DUPLICATE_MOVIE_ID},
          data: {movieId: KEEPER_MOVIE_ID},
        });

        const duplicateCredits = await tx.movieCredit.findMany({
          where: {movieId: DUPLICATE_MOVIE_ID},
          select: {id: true, personId: true, creditType: true},
        });

        for (const credit of duplicateCredits) {
          const existingCredit = await tx.movieCredit.findUnique({
            where: {
              movieId_personId_creditType: {
                movieId: KEEPER_MOVIE_ID,
                personId: credit.personId,
                creditType: credit.creditType,
              },
            },
            select: {id: true},
          });

          if (existingCredit) {
            await tx.movieCredit.delete({where: {id: credit.id}});
          } else {
            await tx.movieCredit.update({
              where: {id: credit.id},
              data: {movieId: KEEPER_MOVIE_ID},
            });
          }
        }

        const duplicateGenres = await tx.movieGenre.findMany({
          where: {movieId: DUPLICATE_MOVIE_ID},
          select: {id: true, name: true},
        });

        for (const genre of duplicateGenres) {
          const existingGenre = await tx.movieGenre.findUnique({
            where: {
              movieId_name: {
                movieId: KEEPER_MOVIE_ID,
                name: genre.name,
              },
            },
            select: {id: true},
          });

          if (existingGenre) {
            await tx.movieGenre.delete({where: {id: genre.id}});
          } else {
            await tx.movieGenre.update({
              where: {id: genre.id},
              data: {movieId: KEEPER_MOVIE_ID},
            });
          }
        }

        const latestKoreanRelease = await tx.movieRelease.findFirst({
          where: {
            movieId: KEEPER_MOVIE_ID,
            countryCode: "KR",
            releaseDate: {not: null},
          },
          orderBy: {releaseDate: "desc"},
          select: {id: true},
        });

        await tx.movieRelease.updateMany({
          where: {movieId: KEEPER_MOVIE_ID},
          data: {isPrimary: false},
        });

        if (latestKoreanRelease) {
          await tx.movieRelease.update({
            where: {id: latestKoreanRelease.id},
            data: {isPrimary: true},
          });
        }

        await tx.movie.delete({where: {id: DUPLICATE_MOVIE_ID}});

        return {
          keeperMovieId: KEEPER_MOVIE_ID,
          deletedMovieId: DUPLICATE_MOVIE_ID,
          movedProviderLinks: duplicateLinks.length,
          movedReleases: duplicateReleases.length,
        };
      },
      {maxWait: 10_000, timeout: 30_000},
    );

    console.log(JSON.stringify(result));
  } finally {
    await app.close();
  }
}

mergeMovieRecords().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
