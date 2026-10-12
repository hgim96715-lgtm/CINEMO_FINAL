import { Injectable } from "@nestjs/common";
import { MovieSyncJobType } from "@prisma/client";

import { MovieSyncRepository } from "./repositories/movie-sync.repository";

@Injectable()
export class MovieSyncService {
  constructor(
    private readonly movieSyncRepository: MovieSyncRepository,
  ) {}

  async start(jobType: MovieSyncJobType) {
    const unfinishedRun =
      await this.movieSyncRepository.findLatestUnfinishedRun(jobType);

    if (unfinishedRun) {
      return this.movieSyncRepository.markRunning(unfinishedRun.id);
    }

    const newRun = await this.movieSyncRepository.createRun(jobType);

    return this.movieSyncRepository.markRunning(newRun.id);
  }

  complete(runId: string) {
    return this.movieSyncRepository.complete(runId);
  }

  fail(runId: string, errorMessage: string) {
    return this.movieSyncRepository.fail(runId, errorMessage);
  }
}
