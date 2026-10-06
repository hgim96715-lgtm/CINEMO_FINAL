import { Controller, Get, Query } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { SearchKmdbMoviesRequestDto } from "./dto/requests/search-kmdb-movies.request.dto";
import { KmdbMovieSearchResponseDto } from "./dto/responses/kmdb-movie-search.response.dto";
import { KmdbService } from "./kmdb.service";

@ApiTags("KMDb")
@ApiCookieAuth("cinemo_session")
@Controller("kmdb")
export class KmdbController {
  constructor(private readonly kmdbService: KmdbService) {}

  @Get("movies/search")
  @ApiOperation({ summary: "KMDb 영화 검색" })
  @ApiOkResponse({
    type: KmdbMovieSearchResponseDto,
  })
  searchMovies(@Query() query: SearchKmdbMoviesRequestDto) {
    return this.kmdbService.searchMovies(query.query, query.page, query.limit);
  }
}
