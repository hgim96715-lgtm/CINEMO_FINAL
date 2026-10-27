import {Injectable} from "@nestjs/common";

import {TmdbService} from "@/integrations/tmdb/tmdb.service";
import type {TmdbMovieDetailResponse} from "@/integrations/tmdb/types/tmdb-response.type";

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
    existingMovie?: TmdbMovieDetailResponse,
  ): Promise<string> {
    const [tmdbMovie, tmdbCredits, trailer, tmdbWatchProviders] =
      await Promise.all([
        existingMovie ?? this.tmdbService.getMovieDetail(tmdbMovieId),
        this.tmdbService.getMovieCredits(tmdbMovieId),
        this.tmdbService.getOfficialTrailer(tmdbMovieId),
        this.tmdbService.getMovieWatchProviders(tmdbMovieId),
      ]);

    const input = toSaveTmdbMovieInput(
      tmdbMovie,
      tmdbCredits,
      trailer,
      tmdbMovieId,
      tmdbWatchProviders,
    );

    return this.repository.syncMovie(movieId, input);
  }

  async syncKoreanReleaseDates(
    movieId: string,
    releaseDates: string[],
  ): Promise<string> {
    const dates = releaseDates
      .map((value) => new Date(`${value}T00:00:00.000Z`))
      .filter((date) => !Number.isNaN(date.getTime()));

    return this.repository.syncKoreanReleaseDates(movieId, dates);
  }
}
