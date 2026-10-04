import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { SourceProvider } from "@prisma/client";

import { KobisService } from "@/integrations/kobis/kobis.service";

import { toKobisMovieImportInput } from "./mappers/kobis-movie-import.mapper";
import { MovieMatcherService } from "./movie-matcher.service";
import { MoviesRepository } from "./movies.repository";

@Injectable()
export class KobisMovieImportService {
  constructor(
    private readonly kobisService: KobisService,
    private readonly movieMatcher: MovieMatcherService,
    private readonly moviesRepository: MoviesRepository,
  ) {}

  async importMovie(
    movieCd: string,
    fallbackTitle?: string,
    preferredMovieId?: string,
  ): Promise<string> {
    const normalizedMovieCd = movieCd.trim();

    const kobisMovie = await this.kobisService.getMovieInfo(normalizedMovieCd);

    const mappedInput = toKobisMovieImportInput(kobisMovie);

    const titleFromKobis =
      typeof mappedInput.title === "string" ? mappedInput.title.trim() : "";

    const title =
      titleFromKobis ||
      (typeof fallbackTitle === "string" ? fallbackTitle.trim() : "");

    if (!title) {
      throw new BadRequestException(
        `KOBIS 영화 제목이 없습니다. movieCd: ${normalizedMovieCd}`,
      );
    }

    const input = {
      ...mappedInput,
      movieCd: normalizedMovieCd,
      title,
    };

    const linkedMovieId = await this.moviesRepository.findMovieIdByProviderLink(
      SourceProvider.KOBIS,
      normalizedMovieCd,
    );

    // 이미 실패한 이전 수집에서 KOBIS 링크가 임시 영화에 남아 있어서 같은영화가 있다는 에러
    // TMDB 연결 영화가 확인되면 그 영화를 기준으로 KOBIS 정보를 재연결로 수정
    let movieId = preferredMovieId ?? linkedMovieId;

    if (!movieId) {
      const candidates = await this.movieMatcher.findCandidates(
        input.title,
        input.releaseDate,
      );

      if (candidates.length > 1) {
        throw new ConflictException({
          code: "MOVIE_MATCH_REVIEW_REQUIRED",
          message: "동일한 영화 후보가 여러 개라 관리자 검토가 필요합니다.",
          candidateMovieIds: candidates.map((candidate) => candidate.id),
        });
      }

      movieId =
        candidates[0]?.id ?? (await this.moviesRepository.createMovieRoot());
    }

    return this.moviesRepository.saveKobisMovie(movieId, input);
  }
}
