import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

import type {
  KobisMovieInfoResponse,
  KobisMovieListResponse,
} from "./types/kobis.types";
import {
  toKobisMovieInfoResponse,
  toKobisMovieSearchItemResponse,
} from "./mappers/kobis-response.mapper";
import { KobisMovieSearchResponseDto } from "./dto/response/kobis-movie-search.response.dto";
import { KobisMovieInfoResponseDto } from "./dto/response/kobis-movie-info.response.dto";

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
}
