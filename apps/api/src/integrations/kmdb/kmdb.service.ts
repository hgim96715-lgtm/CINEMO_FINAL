import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";

import type {
  KmdbMovieResult,
  KmdbSearchResponse,
} from "./types/kmdb-response.type";
import { toKmdbMovieSearchResponseDto } from "./mappers/kmdb-response.mapper";
import { KmdbMovieSearchResponseDto } from "./dto/responses/kmdb-movie-search.response.dto";

@Injectable()
export class KmdbService {
  // KMDb 전용 HTTP 설정은 kmdb.module.ts에서 등록
  constructor(private readonly httpService: HttpService) {}
  async searchMovies(
    query: string,
    page = 1,
    limit = 10,
  ): Promise<KmdbMovieSearchResponseDto> {
    const { data } = await firstValueFrom(
      this.httpService.get<KmdbSearchResponse>("", {
        params: {
          collection: "kmdb_new2",
          detail: "Y",
          title: query,
          listCount: limit,
          startCount: (page - 1) * limit, // KMDb offset은 0부터 시작
        },
      }),
    );
    return toKmdbMovieSearchResponseDto(data);
  }

  async getMovieByDocId(
    docId: string,
    title: string,
  ): Promise<KmdbMovieResult | null> {
    const { data } = await firstValueFrom(
      this.httpService.get<KmdbSearchResponse>("", {
        params: {
          collection: "kmdb_new2",
          detail: "Y",
          title,
          listCount: 100,
          startCount: 0,
        },
      }),
    );

    return (
      data.Data?.flatMap((item) => item.Result ?? []).find(
        (movie) => movie.DOCID === docId,
      ) ?? null
    );
  }
}
