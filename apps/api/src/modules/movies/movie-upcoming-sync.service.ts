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
  
  async run(){
    const run=await this.movieSyncService.start(MovieSyncJobType.UPCOMINT_RELEASES);
    try{
      const [kobisMovieIds,tmdbMovieIds]=await Promise.all([
          this.kobisMovieBatchImportService.importUpcomingMovies(),
          this.tmdbMovieBatchImportService.importUpcomingMovies(10)
      ]);
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