import { Injectable, Logger } from "@nestjs/common";
import { MovieSyncJobType } from "@prisma/client";

import { MovieSyncService } from "./movie-sync.service";
import { PeopleService } from "./people.service";
import { MoviePersonEnrichmentRepository } from "./repositories/movie-person-enrichment.repository";

const PAGE_SIZE = 50;
const CONCURRENCY = 5;
const DEFAULT_LIMIT = 100;

@Injectable()
export class MoviePersonEnrichmentService {
  private readonly logger = new Logger(MoviePersonEnrichmentService.name);

  constructor(
    private readonly movieSyncService: MovieSyncService,
    private readonly peopleService: PeopleService,
    private readonly repository: MoviePersonEnrichmentRepository,
  ) {}

  async run(limit = DEFAULT_LIMIT) {
    const run = await this.movieSyncService.start(
      MovieSyncJobType.MOVIE_ENTICHMENT,
    );
    let cursor = run.currentCursor ?? undefined;
    let processedCount = run.processedCount;
    let successCount = run.successCount;
    let failureCount = run.failureCount;

    try {
      while (processedCount < limit) {
        const people = await this.repository.findPendingPeople(
          cursor,
          Math.min(PAGE_SIZE, limit - processedCount),
        );

        if (people.length === 0) {
          break;
        }

        for (let index = 0; index < people.length; index += CONCURRENCY) {
          const chunk = people.slice(index, index + CONCURRENCY);
          const results = await Promise.allSettled(
            chunk.map((person) => this.enrichPerson(person)),
          );

          results.forEach((result, resultIndex) => {
            if (result.status === "fulfilled") {
              successCount += 1;
              return;
            }

            failureCount += 1;
            const person = chunk[resultIndex];
            const message =
              result.reason instanceof Error
                ? result.reason.message
                : String(result.reason);

            this.logger.error(
              `인물 보완에 실패했습니다. personId=${person.id}, name=${person.name}, error=${message}`,
            );
          });

          processedCount += chunk.length;
          cursor = chunk.at(-1)?.id;

          await this.movieSyncService.updateProgress(run.id, {
            currentCursor: cursor,
            processedCount,
            successCount,
            failureCount,
          });
        }
      }

      if (failureCount > 0) {
        await this.movieSyncService.partial(
          run.id,
          `${failureCount}개 인물 보완 실패`,
        );
      } else {
        await this.movieSyncService.complete(run.id);
      }

      return {
        runId: run.id,
        processedCount,
        successCount,
        failureCount,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "인물 보완 배치 실패";

      await this.movieSyncService.fail(run.id, errorMessage);
      throw error;
    }
  }

  private async enrichPerson(
    person: Awaited<ReturnType<MoviePersonEnrichmentRepository["findPendingPeople"]>>[number],
  ) {
    const tmdbPersonId = Number(person.providerLinks[0]?.externalId);

    if (!Number.isInteger(tmdbPersonId)) {
      throw new Error("TMDB 인물 ID가 올바르지 않습니다.");
    }

    await this.peopleService.enrichFromTmdb(person.id, tmdbPersonId);
  }
}
