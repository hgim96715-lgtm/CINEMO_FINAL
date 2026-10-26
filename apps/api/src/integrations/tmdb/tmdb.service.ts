import {HttpService} from "@nestjs/axios";
import {BadRequestException, Injectable} from "@nestjs/common";
import {firstValueFrom} from "rxjs";
import type {
  TmdbGenreListResponse,
  TmdbMovieCreditsResponse,
  TmdbMovieDetailResponse,
  TmdbMovieListResponse,
  TmdbMovieReleaseDatesResponse,
  TmdbMovieSearchResponse,
  TmdbMovieVideo,
  TmdbMovieVideosResponse,
  TmdbMovieWatchProvidersResponse,
  TmdbPersonDetailResponse,
  TmdbPersonMovieCreditsResponse,
  TmdbPersonSearchResponse,
} from "./types/tmdb-response.type";

export interface TmdbUpcomingMovieDateRange {
  startDate: string;
  endDate: string;
}

@Injectable()
export class TmdbService {
  private static readonly CINEMO_TIME_ZONE = "Asia/Seoul";
  private static readonly UPCOMING_LOOKAHEAD_MONTHS = 3;
  private static readonly RELEASE_CHECK_CONCURRENCY = 5;

  // TMDB 전용 HTTP 설정은 tmdb.module.ts에서 등록
  constructor(private readonly httpService: HttpService) {}

  async searchMovies(
    query: string,
    page = 1,
  ): Promise<TmdbMovieSearchResponse> {
    const params = {
      query: query.trim(),
      page,
      language: "ko-KR",
      include_adult: false,
    };

    const [{ data: movieSearch }, { data: personSearch }] = await Promise.all([
      firstValueFrom(
        this.httpService.get<TmdbMovieSearchResponse>("/search/movie", {
          params,
        }),
      ),
      firstValueFrom(
        this.httpService.get<TmdbPersonSearchResponse>("/search/person", {
          params,
        }),
      ),
    ]);

    const personIds = personSearch.results
      .slice(0, 3)
      .map((person) => person.id);

    const personCreditResponses = await Promise.all(
      personIds.map((personId) =>
        firstValueFrom(
          this.httpService.get<TmdbPersonMovieCreditsResponse>(
            `/person/${personId}/movie_credits`,
            {
              params: { language: "ko-KR" },
            },
          ),
        ),
      ),
    );

    const personMovies = personCreditResponses.flatMap(
      ({ data }) => [...data.cast, ...data.crew],
    );

    const uniqueMovies = new Map<
      number,
      TmdbMovieSearchResponse["results"][number]
    >();

    for (const movie of [...movieSearch.results, ...personMovies]) {
      if (movie.adult || !movie.title || !/[가-힣]/.test(movie.title)) {
        continue;
      }

      if (!uniqueMovies.has(movie.id)) {
        uniqueMovies.set(movie.id, {
          adult: movie.adult,
          backdrop_path: movie.backdrop_path,
          id: movie.id,
          original_language: movie.original_language,
          original_title: movie.original_title,
          overview: movie.overview,
          popularity: movie.popularity,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          title: movie.title,
          video: movie.video,
          vote_average: movie.vote_average,
          vote_count: movie.vote_count,
          genre_ids: movie.genre_ids ?? [],
        });
      }
    }

    const allResults = [...uniqueMovies.values()];
    const pageSize = movieSearch.results.length || 20;
    const startIndex = (page - 1) * pageSize;
    const totalResults = Math.max(movieSearch.total_results, allResults.length);

    return {
      page,
      results: allResults.slice(startIndex, startIndex + pageSize),
      total_pages: Math.max(
        movieSearch.total_pages,
        Math.ceil(totalResults / pageSize),
      ),
      total_results: totalResults,
    };
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

  async getUpcomingMovies(
    page = 1,
    dateRange?: TmdbUpcomingMovieDateRange,
  ): Promise<TmdbMovieListResponse> {
    const startDate = dateRange?.startDate ?? this.getDateInCinemoTimeZone();
    const endDate =
      dateRange?.endDate ??
      this.getDateInCinemoTimeZone(TmdbService.UPCOMING_LOOKAHEAD_MONTHS);

    const { data } = await firstValueFrom(
      this.httpService.get<TmdbMovieListResponse>("/discover/movie", {
        params: {
          page,
          region: "KR",
          language: "ko-KR",
          include_adult: false,
          include_video: false,
          "with_runtime.gte": 31,
          sort_by: "primary_release_date.asc",
          "primary_release_date.gte": startDate,
          "primary_release_date.lte": endDate,
          with_release_type: "2|3",
        },
      }),
    );

    const verifiedResults: TmdbMovieListResponse["results"] = [];

    for (
      let index = 0;
      index < data.results.length;
      index += TmdbService.RELEASE_CHECK_CONCURRENCY
    ) {
      const batch = data.results.slice(
        index,
        index + TmdbService.RELEASE_CHECK_CONCURRENCY,
      );

      const verifiedBatch = await Promise.all(
        batch.map(async (movie) => {
          const releaseDates = await this.getMovieReleaseDates(movie.id);
          const koreanReleases = releaseDates.results.find(
            (country) => country.iso_3166_1 === "KR",
          );

          const hasUpcomingKoreanTheatricalRelease =
            koreanReleases?.release_dates.some(
              (release) =>
                [2, 3].includes(release.type) &&
                release.release_date.slice(0, 10) >= startDate &&
                release.release_date.slice(0, 10) <= endDate,
            ) ?? false;

          return hasUpcomingKoreanTheatricalRelease ? movie : null;
        }),
      );

      verifiedResults.push(
        ...verifiedBatch.filter(
          (movie): movie is TmdbMovieListResponse["results"][number] =>
            movie !== null,
        ),
      );
    }

    if (verifiedResults.length > 0 || dateRange) {
      return {
        ...data,
        results: verifiedResults,
      };
    }

    // TMDB에 한국 개봉일이 아직 등록되지 않은 경우 discover 결과가
    // 전부 탈락할 수 있으므로, TMDB가 제공하는 한국 upcoming 목록을 사용
    const { data: fallback } = await firstValueFrom(
      this.httpService.get<TmdbMovieListResponse>("/movie/upcoming", {
        params: {
          page,
          region: "KR",
          language: "ko-KR",
        },
      }),
    );

    return fallback;
  }

  async getMovieReleaseDates(
    tmdbMovieId: number,
  ): Promise<TmdbMovieReleaseDatesResponse> {
    const { data } = await firstValueFrom(
      this.httpService.get<TmdbMovieReleaseDatesResponse>(
        `/movie/${tmdbMovieId}/release_dates`,
      ),
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

  async getPersonDetail(
    tmdbPersonId: number,
  ): Promise<TmdbPersonDetailResponse> {
    const { data } = await firstValueFrom(
      this.httpService.get<TmdbPersonDetailResponse>(
        `/person/${tmdbPersonId}`,
        {
          params: {
            language: "ko-KR",
          },
        },
      ),
    );

    return data;
  }

  async getPersonMovieCredits(
    tmdbPersonId: number,
  ): Promise<TmdbPersonMovieCreditsResponse> {
    const { data } = await firstValueFrom(
      this.httpService.get<TmdbPersonMovieCreditsResponse>(
        `/person/${tmdbPersonId}/movie_credits`,
        {
          params: {
            language: "ko-KR",
          },
        },
      ),
    );

    return data;
  }

  async searchPeople(
    query: string,
    page = 1,
  ): Promise<TmdbPersonSearchResponse> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      throw new BadRequestException("인물 검색어가 필요합니다.");
    }

    const { data } = await firstValueFrom(
      this.httpService.get<TmdbPersonSearchResponse>("/search/person", {
        params: {
          query: normalizedQuery,
          page,
          language: "ko-KR",
          include_adult: false,
        },
      }),
    );

    return data;
  }
  
  async getMovieWatchProviders(
      tmdbMovieId: number,
  ):Promise<TmdbMovieWatchProvidersResponse>{
    const {data}=await firstValueFrom(
        this.httpService.get<TmdbMovieWatchProvidersResponse>(
            `/movie/${tmdbMovieId}/watch/providers`
        )
    );
    return  data;
  }
  
  
  private getDateInCinemoTimeZone(monthOffset = 0): string {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TmdbService.CINEMO_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const year = Number(parts.find((part) => part.type === "year")?.value);
    const month = Number(parts.find((part) => part.type === "month")?.value);
    const day = Number(parts.find((part) => part.type === "day")?.value);
    const date = new Date(Date.UTC(year, month - 1, day));

    date.setUTCMonth(date.getUTCMonth() + monthOffset);

    return date.toISOString().slice(0, 10);
  }
}
