import {TmdbMovieBatchImportService} from "@/modules/movies/tmdb-movie-batch-import.service";
import {KobisMovieBatchImportService} from "@/modules/movies/kobis-movie-batch-import.service";
import {MovieSyncService} from "@/modules/movies/movie-sync.service";
import {Injectable} from "@nestjs/common";
import {MovieSyncJobType} from "@prisma/client";

@Injectable()
export class MovieUpcomingSyncService {
  constructor (
      private readonly movieSyncService: MovieSyncService,
      private readonly kobisMovieBatchImportService: KobisMovieBatchImportService,
      private readonly tmdbMovieBatchImportService: TmdbMovieBatchImportService,
  ) {}
  
  async run(pageCount = 10){
    const run=await this.movieSyncService.start(MovieSyncJobType.UPCOMINT_RELEASES);
    try{
      // 두 수집기를 동시에 실행하면 같은 영화의 provider link 생성이 경쟁하여
      // KOBIS와 TMDB가 서로 다른 Movie 레코드를 만들 수 있음.
      // KOBIS를 먼저 저장한 뒤 TMDB가 기존 링크를 보강하도록 순차 실행함.
      const kobisMovieIds =
        await this.kobisMovieBatchImportService.importUpcomingMovies();
      const tmdbMovieIds =
        await this.tmdbMovieBatchImportService.importUpcomingMovies(pageCount);
      const movieIds=[...new Set([...kobisMovieIds,...tmdbMovieIds])];
      await this.movieSyncService.complete(run.id);
      return {
        runId: run.id,
        movieIds,
      };
    }catch(error){
      const errorMessage=error instanceof  Error? error.message:"개봉 예정작 동기화 실패";
      await this.movieSyncService.fail(run.id,errorMessage);
      throw error;
    }
  }
}
