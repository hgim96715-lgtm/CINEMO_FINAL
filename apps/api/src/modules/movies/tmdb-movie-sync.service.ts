import {Injectable} from "@nestjs/common";

import {TmdbService} from "@/integrations/tmdb/tmdb.service";

import {toSaveTmdbMovieInput} from "./mappers/tmdb-movie-sync.mapper";
import {TmdbMovieSyncRepository} from "./repositories/tmdb-movie-sync.repository";

@Injectable()
export class TmdbMovieSyncService {
  constructor(
    private readonly tmdbService: TmdbService,
    private readonly repository: TmdbMovieSyncRepository,
  ) {}

  async syncMovieFromTmdb(
    movieId: string,
    tmdbMovieId: number,
  ): Promise<string> {
    const tmdbMovie = await this.tmdbService.getMovieDetail(tmdbMovieId);
    const tmdbCredits = await this.tmdbService.getMovieCredits(tmdbMovieId);
    const trailer = await this.tmdbService.getOfficialTrailer(tmdbMovieId);
    const tmdbWatchProviders =
      await this.tmdbService.getMovieWatchProviders(tmdbMovieId);

    const input = toSaveTmdbMovieInput(
      tmdbMovie,
      tmdbCredits,
      trailer,
      tmdbMovieId,
      tmdbWatchProviders,
    );

    return this.repository.syncMovie(movieId, input);
  }
}
