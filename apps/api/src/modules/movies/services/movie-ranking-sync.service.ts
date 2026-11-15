import {Injectable} from "@nestjs/common";

import {KobisMovieBatchImportService} from "./kobis-movie-batch-import.service";
import {MovieSyncService} from "./movie-sync.service";
import {MovieSyncJobType} from "@prisma/client";

@Injectable()
export class MovieRankingSyncService {
  constructor (
      private readonly movieSyncService: MovieSyncService,
      private readonly kobisMovieBatchImportService: KobisMovieBatchImportService,
  ) {}
  async run(targetDate:string){
    const run=await this.movieSyncService.start(MovieSyncJobType.DAILY_RANKING);
    try{
      const movieIds=await this.kobisMovieBatchImportService.importDailyBoxOffice(targetDate);
      await this.movieSyncService.complete(run.id);
      return {runId:run.id,movieIds};
    }catch(error){
      const errorMessage=error instanceof Error ? error.message :"순위 동기화 실패";
      await this.movieSyncService.fail(run.id,errorMessage);
      throw error;
    }
  }
}