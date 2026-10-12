import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

import {
  KobisDailyBoxOfficeResponse,
  type KobisDailyBoxOfficeMovie,
  type KobisMovieInfoResponse,
  type KobisMovieListResponse,
} from "./types/kobis.types";
import {
  toKobisDailyBoxOfficeResponse,
  toKobisMovieInfoResponse,
  toKobisMovieSearchItemResponse,
} from "./mappers/kobis-response.mapper";
import { KobisMovieSearchResponseDto } from "./dto/responses/kobis-movie-search.response.dto";
import { KobisMovieInfoResponseDto } from "./dto/responses/kobis-movie-info.response.dto";
import { KobisDailyBoxOfficeResponseDto } from "./dto/responses/kobis-daily-box-office.response.dto";

@Injectable()
export class KobisService {
  // KOBIS 전용 HTTP 설정은 kobis.module.ts에서 등록
  constructor(private readonly httpService: HttpService) {}

  async searchMovies(
    query: string,
    page = 1,
    limit = 10,
  ): Promise<KobisMovieSearchResponseDto> {
    const { data } = await firstValueFrom(
      this.httpService.get<KobisMovieListResponse>(
        "/movie/searchMovieList.json",
        {
          params: {
            movieNm: query,
            curPage: page,
            itemPerPage: limit,
          },
        },
      ),
    );
    return {
      totalCount: Number(data.movieListResult.totCnt),
      results: data.movieListResult.movieList.map(
        toKobisMovieSearchItemResponse,
      ),
    };
  }

  async searchMoviesByProductionYear(
    productionStartYear: number,
    productionEndYear: number,
    page = 1,
    limit = 20,
  ): Promise<KobisMovieSearchResponseDto> {
    const { data } = await firstValueFrom(
      this.httpService.get<KobisMovieListResponse>(
        "/movie/searchMovieList.json",
        {
          params: {
            prdtStartYear: productionStartYear,
            prdtEndYear: productionEndYear,
            curPage: page,
            itemPerPage: limit,
          },
        },
      ),
    );

    return {
      totalCount: Number(data.movieListResult.totCnt),
      results: data.movieListResult.movieList.map(
        toKobisMovieSearchItemResponse,
      ),
    };
  }

  async searchMoviesByReleaseDate(
    releaseStartYear: string,
    releaseEndYear: string,
    page = 1,
    limit = 20,
  ): Promise<KobisMovieSearchResponseDto> {
    if (
      !/^\d{4}$/.test(releaseStartYear) ||
      !/^\d{4}$/.test(releaseEndYear)
    ) {
      throw new BadRequestException(
        "KOBIS 개봉 연도는 YYYY 형식이어야 합니다.",
      );
    }

    const { data } = await firstValueFrom(
      this.httpService.get<KobisMovieListResponse>(
        "/movie/searchMovieList.json",
        {
          params: {
            openStartDt: releaseStartYear,
            openEndDt: releaseEndYear,
            curPage: page,
            itemPerPage: limit,
          },
        },
      ),
    );

    if (!data.movieListResult) {
      const faultInfo = (
        data as unknown as { faultInfo?: { message?: string } }
      ).faultInfo;

      throw new BadGatewayException(
        faultInfo?.message ?? "KOBIS 영화 목록 응답이 올바르지 않습니다.",
      );
    }

    return {
      totalCount: Number(data.movieListResult.totCnt),
      results: data.movieListResult.movieList.map(
        toKobisMovieSearchItemResponse,
      ),
    };
  }

  async getMovieInfo(movieCd: string): Promise<KobisMovieInfoResponseDto> {
    const { data } = await firstValueFrom(
      this.httpService.get<KobisMovieInfoResponse>(
        "/movie/searchMovieInfo.json",
        {
          params: {
            movieCd,
          },
        },
      ),
    );

    return toKobisMovieInfoResponse(data.movieInfoResult.movieInfo);
  }

  async getDailyBoxOffice(
    targetDt: string,
  ): Promise<KobisDailyBoxOfficeResponseDto> {
    if (!/^\d{8}$/.test(targetDt)) {
      throw new BadRequestException("targetDt는 YYYYMMDD 형식이어야 합니다.");
    }

    const { data } = await firstValueFrom(
      this.httpService.get<KobisDailyBoxOfficeResponse>(
        "/boxoffice/searchDailyBoxOfficeList.json",
        {
          params: {
            targetDt,
          },
        },
      ),
    );

    return toKobisDailyBoxOfficeResponse(
      data.boxOfficeResult.dailyBoxOfficeList,
    );
  }
}
