import { Controller, Get, Param, Query } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { SearchKobisMoviesRequestDto } from "./dto/requests/search-kobis-movies.request.dto";
import { KobisMovieSearchResponseDto } from "./dto/responses/kobis-movie-search.response.dto";
import { KobisService } from "./kobis.service";
import { KobisMovieInfoResponseDto } from "./dto/responses/kobis-movie-info.response.dto";
import { GetKobisMovieInfoRequestDto } from "./dto/requests/get-kobis-movie-info.request.dto";
import { GetKobisDailyBoxOfficeRequestDto } from "./dto/requests/get-kobis-daily-box-office.request.dto";
import {
  KobisDailyBoxOfficeItemResponseDto,
  KobisDailyBoxOfficeResponseDto,
} from "./dto/responses/kobis-daily-box-office.response.dto";

@ApiTags("KOBIS")
@Controller("kobis")
export class KobisController {
  constructor(private readonly kobisService: KobisService) {}

  @Get("movies/search")
  @ApiOperation({
    summary: "KOBIS 영화 검색",
    description: "영화 제목으로 KOBIS 영화 목록 검색",
  })
  @ApiOkResponse({
    type: KobisMovieSearchResponseDto,
    description: "KOBIS 영화 검색 성공",
  })
  @ApiBadRequestResponse({
    description: "검색 조건이 올바르지 않습니다.",
  })
  searchMovies(@Query() query: SearchKobisMoviesRequestDto) {
    return this.kobisService.searchMovies(query.query, query.page, query.limit);
  }

  @Get("movies/:movieCd")
  @ApiOperation({
    summary: "KOBIS 영화 상세 조회",
    description: "KOBIS 영화 코드로 영화 상세 정보 조회",
  })
  @ApiOkResponse({
    type: KobisMovieInfoResponseDto,
    description: "KOBIS 영화 상세 조회 성공",
  })
  @ApiBadRequestResponse({
    description: "KOBIS 영화 코드가 올바르지 않습니다.",
  })
  getMovieInfo(@Param() params: GetKobisMovieInfoRequestDto) {
    return this.kobisService.getMovieInfo(params.movieCd);
  }

  @Get("box-office/daily")
  @ApiOperation({
    summary: "KOBIS 일별 박스오피스 조회",
    description: "기준일의 국내 일별 박스오피스 조회",
  })
  @ApiOkResponse({
    type: KobisDailyBoxOfficeResponseDto,
    description: "일별 박스오피스 조회 성공",
  })
  getDailyBoxOffice(@Query() query: GetKobisDailyBoxOfficeRequestDto) {
    return this.kobisService.getDailyBoxOffice(query.targetDt);
  }
}
