import {Controller, Delete, Get, Param, Post} from "@nestjs/common";
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import {Public} from "../auth/decorators/public.decorator";

import {EnrichTmdbPersonRequestDto} from "./dto/requests/enrich-tmdb-person.request.dto";
import {PersonDetailResponseDto} from "./dto/responses/person-detail.response.dto";
import {toBookmarkedPeopleResponse, toPersonDetailResponse} from "./mappers/people.mapper";
import {PeopleService} from "./people.service";
import {Throttle} from "node_modules/@nestjs/throttler/dist";
import {UserPersonBookmarkService} from "./user-person-bookmark.service";
import {CurrentUser} from "../auth/decorators/current-user.decorator";
import type {SessionUser} from "../auth/types/session-user.type";

@ApiTags("People")
@Controller("people")
export class PeopleController {
  constructor(
    private readonly peopleService: PeopleService,
    private readonly userPersonBookmarkService: UserPersonBookmarkService,
  ) {}

  @ApiCookieAuth("cinemo_session")
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Get("bookmarks")
  @ApiOperation({
    summary: "저장한 인물 목록 조회",
  })
  async findBookmarkedPeople(@CurrentUser() user: SessionUser) {
    const bookmarks= await this.userPersonBookmarkService.findAllByUser(user.id);
    return toBookmarkedPeopleResponse(bookmarks);
  }

  @Public()
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Get(":personId")
  @ApiOperation({
    summary: "인물 상세 정보 조회",
    description: "감독·배우의 기본 정보와 필모그래피 조회",
  })
  @ApiOkResponse({
    description: "인물 상세 정보",
    type: PersonDetailResponseDto,
  })
  @ApiNotFoundResponse({
    description: "인물을 찾을 수 없음",
  })
  async findById(@Param("personId") personId: string) {
    const person = await this.peopleService.findById(personId);

    return toPersonDetailResponse(person);
  }

  @Public()
  @Post(":personId/enrich/tmdb/:tmdbPersonId")
  @ApiOperation({
    summary: "TMDB 인물 정보 보완",
    description:
      "TMDB 인물 정보에서 프로필 이미지·소개·출생일·출생지를 가져와 보완",
  })
  @ApiOkResponse({
    description: "보완된 인물 정보",
    type: PersonDetailResponseDto,
  })
  @ApiNotFoundResponse({
    description: "인물 또는 TMDB 연결 정보를 찾을 수 없음",
  })
  @ApiConflictResponse({
    description: "TMDB 인물이 다른 CINEMO 인물과 연결되어 있음",
  })
  async enrichFromTmdb(@Param() params: EnrichTmdbPersonRequestDto) {
    await this.peopleService.enrichFromTmdb(
      params.personId,
      params.tmdbPersonId,
    );

    const person = await this.peopleService.findById(params.personId);

    return toPersonDetailResponse(person);
  }

  @ApiCookieAuth("cinemo_session")
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Get(":personId/bookmark")
  @ApiOperation({
    summary: "인물 북마크 상태 조회",
  })
  async getBookmarkStatus(
    @Param("personId") personId: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.userPersonBookmarkService.findStatus(user.id, personId);
  }

  @ApiCookieAuth("cinemo_session")
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Post(":personId/bookmark")
  @ApiOperation({
    summary: "인물 북마크 추가",
  })
  async addBookmark(
    @Param("personId") personId: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.userPersonBookmarkService.add(user.id, personId);
  }

  @ApiCookieAuth("cinemo_session")
  @Throttle({
    default: {
      limit: 60,
      ttl: 60_000,
    },
  })
  @Delete(":personId/bookmark")
  @ApiOperation({
    summary: "인물 북마크 삭제",
  })
  async removeBookmark(
    @Param("personId") personId: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.userPersonBookmarkService.remove(user.id, personId);
  }
}
