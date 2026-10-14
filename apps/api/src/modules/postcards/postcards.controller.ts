import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { SessionUser } from "../auth/types/session-user.type";
import { PostcardService } from "./services/postcard.service";
import { CreatePostcardRequestDto } from "@/modules/postcards/dto/requests/create-postcard-request.dto";
import { toPostcardResponse } from "@/modules/postcards/dto/mappers/postcard.mapper";
import { PostcardResponseDto } from "@/modules/postcards/dto/responses/postcard.response.dto";
import { GetPostcardFeedRequestDto } from "@/modules/postcards/dto/requests/get-postcard-feed-request.dto";
import { Public } from "@/modules/auth/decorators/public.decorator";
import { PostcardFeedResponseDto } from "@/modules/postcards/dto/responses/postcard-feed.response.dto";
import { CreatePostcardCommentRequestDto } from "@/modules/postcards/dto/requests/create-postcard-comment-request.dto";
import { UpdatePostcardCommentRequestDto } from "@/modules/postcards/dto/requests/update-postcard-comment-request.dto";
import { PostcardCommentResponseDto } from "@/modules/postcards/dto/responses/postcard-comment.response.dto";
import { toPostcardCommentResponse } from "@/modules/postcards/dto/mappers/postcard-comment.mapper";
import { GetPostcardCommentsRequestDto } from "@/modules/postcards/dto/requests/get-postcard-comments-request.dto";
import { UpdatePostcardRequestDto } from "@/modules/postcards/dto/requests/update-postcard-request.dto";
import { OptionalAuth } from "../auth/decorators/optional-auth.decorator";
import { CreatePostcardReactionRequestDto } from "@/modules/postcards/dto/requests/create-postcard-reaction-request.dto";
import { CreatePostcardReportRequestDto } from "@/modules/postcards/dto/requests/create-postcard-report-request.dto";
import { CreatePostcardShareRequestDto } from "@/modules/postcards/dto/requests/create-postcard-share-request.dto";
import { GetPostcardNotificationsRequestDto } from "@/modules/postcards/dto/requests/get-postcard-notifications-request.dto";
import { PostcardNotificationFeedResponseDto } from "@/modules/postcards/dto/responses/postcard-notification-feed.response.dto";
import { toPostcardNotificationResponse } from "@/modules/postcards/dto/mappers/postcard-notification.mapper";
import { OpenAiService } from "@/integrations/openai/openai.service";
import { CreatePostcardQuoteSuggestionRequestDto } from "@/modules/postcards/dto/requests/create-postcard-quote-suggestion-request.dto";
import { PostcardQuoteSuggestionResponseDto } from "@/modules/postcards/dto/responses/postcard-quote-suggestion.response.dto";
import { Throttle } from "@nestjs/throttler";

@ApiTags("Postcards")
@Controller("postcards")
export class PostcardsController {
  constructor(
    private readonly postcardService: PostcardService,
    private readonly openAiService: OpenAiService,
  ) {}

  @ApiCookieAuth("cinemo_session")
  @Throttle({
    default: {
      limit: 3,
      ttl: 60_000,
    },
  })
  @Post("ai/quote-suggestion")
  @ApiOperation({
    summary: "AI 인용 문구 추천",
    description: "영화에서 영감을 받은 창작 문장과 한국어 번역을 반환",
  })
  @ApiCreatedResponse({
    description: "AI 인용 문구 추천 성공",
    type: PostcardQuoteSuggestionResponseDto,
  })
  async suggestQuote(
    @Body() request: CreatePostcardQuoteSuggestionRequestDto,
  ) {
    return this.openAiService.suggestQuote(request);
  }

  @OptionalAuth()
  @Get("feed")
  @ApiOperation({
    summary: "공개 엽서 피드 조회",
  })
  @ApiOkResponse({
    description: "공개 엽서 피드 조회 성공",
    type: PostcardFeedResponseDto,
  })
  async findPublicFeed(
    @Query() request: GetPostcardFeedRequestDto,
    @CurrentUser() user: SessionUser | undefined,
  ) {
    const result = await this.postcardService.findPublicFeed(user?.id, request);

    return {
      items: result.items.map(toPostcardResponse),
      nextCursor: result.nextCursor,
      hasNextPage: result.hasNextPage,
    };
  }

  @ApiCookieAuth("cinemo_session")
  @Get("notifications")
  @ApiOperation({
    summary: "내 엽서 알림 목록 조회",
  })
  @ApiOkResponse({
    description: "엽서 알림 목록 조회 성공",
    type: PostcardNotificationFeedResponseDto,
  })
  async findNotifications(
    @CurrentUser() user: SessionUser,
    @Query() request: GetPostcardNotificationsRequestDto,
  ) {
    const result = await this.postcardService.findNotifications(
      user.id,
      request,
    );

    return {
      items: result.items.map(toPostcardNotificationResponse),
      nextCursor: result.nextCursor,
      hasNextPage: result.hasNextPage,
    };
  }

  @ApiCookieAuth("cinemo_session")
  @Patch("notifications/:notificationId/read")
  @ApiOperation({
    summary: "엽서 알림 읽음 처리",
  })
  @ApiOkResponse({
    description: "알림 읽음 처리 성공",
  })
  async markNotificationAsRead(
    @Param("notificationId") notificationId: string,
    @CurrentUser() user: SessionUser,
  ) {
    await this.postcardService.markNotificationAsRead(user.id, notificationId);

    return { read: true };
  }

  @ApiCookieAuth("cinemo_session")
  @Get("mine")
  @ApiOperation({
    summary: "내 엽서 목록 조회",
  })
  @ApiOkResponse({
    description: "내 엽서 목록 조회 성공",
    type: PostcardFeedResponseDto,
  })
  async findMine(
    @CurrentUser() user: SessionUser,
    @Query() request: GetPostcardFeedRequestDto,
  ) {
    const result = await this.postcardService.findMine(user.id, request);

    return {
      items: result.items.map(toPostcardResponse),
      nextCursor: result.nextCursor,
      hasNextPage: result.hasNextPage,
    };
  }

  @OptionalAuth()
  @ApiCookieAuth("cinemo_session")
  @Get(":postcardId")
  @ApiOperation({
    summary: "엽서 상세 조회",
  })
  @ApiOkResponse({
    description: "엽서 상세 조회 성공",
    type: PostcardResponseDto,
  })
  @ApiNotFoundResponse({
    description: "엽서를 찾을 수 없음",
  })
  async findById(
    @Param("postcardId") postcardId: string,
    @CurrentUser() user: SessionUser | undefined,
  ) {
    const postcard = await this.postcardService.findById(user?.id, postcardId);

    return toPostcardResponse(postcard);
  }

  @ApiCookieAuth("cinemo_session")
  @Patch(":postcardId")
  @ApiOperation({
    summary: "엽서 수정",
  })
  @ApiOkResponse({
    description: "엽서 수정 성공",
    type: PostcardResponseDto,
  })
  async update(
    @Param("postcardId") postcardId: string,
    @CurrentUser() user: SessionUser,
    @Body() request: UpdatePostcardRequestDto,
  ) {
    const postcard = await this.postcardService.update(
      user.id,
      postcardId,
      request,
    );

    return toPostcardResponse(postcard);
  }

  @ApiCookieAuth("cinemo_session")
  @Patch(":postcardId/publish")
  @ApiOperation({
    summary: "엽서 발행",
  })
  @ApiOkResponse({
    description: "엽서 발행 성공",
    type: PostcardResponseDto,
  })
  async publish(
    @Param("postcardId") postcardId: string,
    @CurrentUser() user: SessionUser,
  ) {
    const postcard = await this.postcardService.publish(user.id, postcardId);

    return toPostcardResponse(postcard);
  }

  @ApiCookieAuth("cinemo_session")
  @Delete(":postcardId")
  @ApiOperation({
    summary: "엽서 삭제",
  })
  @ApiOkResponse({
    description: "엽서 삭제 성공",
  })
  async remove(
    @Param("postcardId") postcardId: string,
    @CurrentUser() user: SessionUser,
  ) {
    await this.postcardService.remove(user.id, postcardId);

    return {
      deleted: true,
    };
  }

  @ApiCookieAuth("cinemo_session")
  @Post()
  @ApiOperation({ summary: "엽서 작성" })
  @ApiCreatedResponse({ description: "엽서 작성 성공" })
  async create(
    @CurrentUser() user: SessionUser,
    @Body() request: CreatePostcardRequestDto,
  ) {
    const postcard = await this.postcardService.create(user.id, request);
    return toPostcardResponse(postcard);
  }

  @ApiCookieAuth("cinemo_session")
  @Post(":postcardId/comments")
  @ApiOperation({
    summary: "엽서 댓글 작성",
  })
  @ApiCreatedResponse({
    description: "댓글 작성 성공",
    type: PostcardCommentResponseDto,
  })
  async createComment(
    @Param("postcardId") postcardId: string,
    @CurrentUser() user: SessionUser,
    @Body() request: CreatePostcardCommentRequestDto,
  ) {
    const comment = await this.postcardService.createComment(
      postcardId,
      user.id,
      request,
    );

    return toPostcardCommentResponse(comment);
  }

  @ApiCookieAuth("cinemo_session")
  @Delete(":postcardId/comments/:commentId")
  @ApiOperation({
    summary: "엽서 댓글 삭제",
  })
  async deleteComment(
    @Param("postcardId") postcardId: string,
    @Param("commentId") commentId: string,
    @CurrentUser() user: SessionUser,
  ) {
    await this.postcardService.deleteComment(
      postcardId,
      commentId,
      user.id,
    );

    return { deleted: true };
  }

  @ApiCookieAuth("cinemo_session")
  @Patch(":postcardId/comments/:commentId")
  @ApiOperation({
    summary: "엽서 댓글 수정",
  })
  @ApiOkResponse({
    description: "댓글 수정 성공",
    type: PostcardCommentResponseDto,
  })
  async updateComment(
    @Param("postcardId") postcardId: string,
    @Param("commentId") commentId: string,
    @CurrentUser() user: SessionUser,
    @Body() request: UpdatePostcardCommentRequestDto,
  ) {
    const comment = await this.postcardService.updateComment(
      postcardId,
      commentId,
      user.id,
      request,
    );

    return toPostcardCommentResponse(comment);
  }

  @ApiCookieAuth("cinemo_session")
  @Post(":postcardId/reactions")
  @ApiOperation({
    summary: "엽서 이모지 반응 추가",
  })
  async addReaction(
    @Param("postcardId") postcardId: string,
    @CurrentUser() user: SessionUser,
    @Body() request: CreatePostcardReactionRequestDto,
  ) {
    return this.postcardService.addReaction(user.id, postcardId, request);
  }

  @ApiCookieAuth("cinemo_session")
  @Delete(":postcardId/reactions/:emoji")
  @ApiOperation({
    summary: "엽서 이모지 반응 삭제",
  })
  async removeReaction(
    @Param("postcardId") postcardId: string,
    @Param("emoji") emoji: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.postcardService.removeReaction(
      user.id,
      postcardId,
      decodeURIComponent(emoji),
    );
  }

  @ApiCookieAuth("cinemo_session")
  @Post(":postcardId/bookmark")
  @ApiOperation({
    summary: "엽서 북마크 추가",
  })
  async addBookmark(
    @Param("postcardId") postcardId: string,
    @CurrentUser() user: SessionUser,
  ) {
    await this.postcardService.addBookmark(user.id, postcardId);
    return { bookmarked: true };
  }

  @ApiCookieAuth("cinemo_session")
  @Delete(":postcardId/bookmark")
  @ApiOperation({
    summary: "엽서 북마크 삭제",
  })
  async removeBookmark(
    @Param("postcardId") postcardId: string,
    @CurrentUser() user: SessionUser,
  ) {
    await this.postcardService.removeBookmark(user.id, postcardId);
    return { bookmarked: false };
  }

  @ApiCookieAuth("cinemo_session")
  @Post(":postcardId/reports")
  @ApiOperation({
    summary: "엽서 신고",
  })
  async report(
    @Param("postcardId") postcardId: string,
    @CurrentUser() user: SessionUser,
    @Body() request: CreatePostcardReportRequestDto,
  ) {
    await this.postcardService.report(user.id, postcardId, request);
    return { reported: true };
  }

  @OptionalAuth()
  @Post(":postcardId/share")
  @ApiOperation({
    summary: "엽서 공유 기록",
  })
  async share(
    @Param("postcardId") postcardId: string,
    @CurrentUser() user: SessionUser | undefined,
    @Body() request: CreatePostcardShareRequestDto,
  ) {
    return this.postcardService.share(user?.id, postcardId, request);
  }

  @Public()
  @Get(":postcardId/comments")
  @ApiOperation({
    summary: "엽서 댓글 목록 조회",
  })
  async findComments(
    @Param("postcardId") postcardId: string,
    @Query() request: GetPostcardCommentsRequestDto,
  ) {
    const result = await this.postcardService.findComments(postcardId, request);

    return {
      items: result.items.map(toPostcardCommentResponse),
      nextCursor: result.nextCursor,
      hasNextPage: result.hasNextPage,
    };
  }
}
