import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import type {
  TmdbGenreListResponse,
  TmdbMovieDetailResponse,
  TmdbMovieCreditsResponse,
  TmdbMovieListResponse,
  TmdbMovieSearchResponse,
  TmdbMovieVideo,
  TmdbMovieVideosResponse,
} from "./types/tmdb-response.type";

@Injectable()
export class TmdbService {
  // TMDB 전용 HTTP 설정은 tmdb.module.ts에서 등록
  constructor(private readonly httpService: HttpService) {}

  async searchMovies(
    query: string,
    page = 1,
  ): Promise<TmdbMovieSearchResponse> {
    const { data } = await firstValueFrom(
      this.httpService.get<TmdbMovieSearchResponse>("/search/movie", {
        params: {
          query,
          page,
          language: "ko-KR",
          include_adult: false,
        },
      }),
    );
    return data;
  }

  async getMovieDetail(tmdbMovieId: number): Promise<TmdbMovieDetailResponse> {
    const { data } = await firstValueFrom(
      this.httpService.get<TmdbMovieDetailResponse>(`/movie/${tmdbMovieId}`, {
        params: {
          language: "ko-KR",
        },
      }),
    );

    return data;
  }

  async getMovieCredits(
    tmdbMovieId: number,
  ): Promise<TmdbMovieCreditsResponse> {
    const { data } = await firstValueFrom(
      this.httpService.get<TmdbMovieCreditsResponse>(
        `/movie/${tmdbMovieId}/credits`,
        {
          params: {
            language: "ko-KR",
          },
        },
      ),
    );

    return data;
  }

  async getNowPlayingMovies(page = 1): Promise<TmdbMovieListResponse> {
    const { data } = await firstValueFrom(
      this.httpService.get<TmdbMovieListResponse>("/movie/now_playing", {
        params: {
          page,
          region: "KR",
          language: "ko-KR",
        },
      }),
    );
    return data;
  }

  async getUpcomingMovies(page = 1): Promise<TmdbMovieListResponse> {
    const { data } = await firstValueFrom(
      this.httpService.get<TmdbMovieListResponse>("/movie/upcoming", {
        params: {
          page,
          region: "KR",
          language: "ko-KR",
        },
      }),
    );
    return data;
  }

  async getPopularMovies(page = 1): Promise<TmdbMovieListResponse> {
    const { data } = await firstValueFrom(
      this.httpService.get<TmdbMovieListResponse>("/movie/popular", {
        params: {
          page,
          language: "ko-KR",
        },
      }),
    );

    return data;
  }

  async getMovieVideos(tmdbMovieId: number): Promise<TmdbMovieVideosResponse> {
    const { data } = await firstValueFrom(
      this.httpService.get<TmdbMovieVideosResponse>(
        `/movie/${tmdbMovieId}/videos`,
        {
          params: {
            language: "ko-KR",
          },
        },
      ),
    );

    return data;
  }

  async getMovieGenres(): Promise<TmdbGenreListResponse> {
    const { data } = await firstValueFrom(
      this.httpService.get<TmdbGenreListResponse>("/genre/movie/list", {
        params: {
          language: "ko-KR",
        },
      }),
    );

    return data;
  }

  findOfficialTrailer(
    response: TmdbMovieVideosResponse,
  ): TmdbMovieVideo | null {
    return (
      response.results
        .filter((video) => video.site === "YouTube")
        .filter((video) => video.type === "Trailer")
        .filter((video) => video.official)
        .filter(
          (video) => video.iso_639_1 === "ko" && video.iso_3166_1 === "KR",
        )
        .sort(
          (a, b) =>
            new Date(b.published_at).getTime() -
            new Date(a.published_at).getTime(),
        )[0] ?? null
    );
  }

  async getOfficialTrailer(
    tmdbMovieId: number,
  ): Promise<TmdbMovieVideo | null> {
    const response = await this.getMovieVideos(tmdbMovieId);

    return this.findOfficialTrailer(response);
  }
}
