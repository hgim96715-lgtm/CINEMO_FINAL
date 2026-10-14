import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PostcardSource, PostcardVisibility } from "@prisma/client";
import type { Postcard as DomainPostcard } from "../domain/postcard.types";
import type {
  CursorPage,
  PostcardCommentWithUser,
} from "../repositories/postcard.repository";
import { PostcardRepository } from "../repositories/postcard.repository";
import { CreatePostcardRequestDto } from "@/modules/postcards/dto/requests/create-postcard-request.dto";
import { GetPostcardFeedRequestDto } from "@/modules/postcards/dto/requests/get-postcard-feed-request.dto";
import { CreatePostcardCommentRequestDto } from "@/modules/postcards/dto/requests/create-postcard-comment-request.dto";
import { UpdatePostcardCommentRequestDto } from "@/modules/postcards/dto/requests/update-postcard-comment-request.dto";
import { GetPostcardCommentsRequestDto } from "@/modules/postcards/dto/requests/get-postcard-comments-request.dto";
import { UpdatePostcardRequestDto } from "@/modules/postcards/dto/requests/update-postcard-request.dto";
import { CreatePostcardReactionRequestDto } from "@/modules/postcards/dto/requests/create-postcard-reaction-request.dto";
import { CreatePostcardReportRequestDto } from "@/modules/postcards/dto/requests/create-postcard-report-request.dto";
import { GetPostcardNotificationsRequestDto } from "@/modules/postcards/dto/requests/get-postcard-notifications-request.dto";
import { CreatePostcardShareRequestDto } from "@/modules/postcards/dto/requests/create-postcard-share-request.dto";
import {
  OpenAiService,
  type SuggestQuoteResult,
} from "@/integrations/openai/openai.service";
import { CreatePostcardQuoteSuggestionRequestDto } from "@/modules/postcards/dto/requests/create-postcard-quote-suggestion-request.dto";
import { OpenSubtitlesService } from "@/integrations/opensubtitles/opensubtitles.service";
import type {
  OpenSubtitlesSubtitleContent,
  OpenSubtitlesSubtitleSearchItem,
} from "@/integrations/opensubtitles/opensubtitles.types";

@Injectable()
export class PostcardService {
  private readonly logger = new Logger(PostcardService.name);

  constructor(
    private readonly postcardRepository: PostcardRepository,
    private readonly openAiService: OpenAiService,
    private readonly openSubtitlesService: OpenSubtitlesService,
  ) {}

  async suggestQuote(
    request: CreatePostcardQuoteSuggestionRequestDto,
  ): Promise<SuggestQuoteResult> {
    const subtitleContent = await this.tryFetchSubtitleContent(request);

    if (subtitleContent?.cues.length) {
      return this.openAiService.suggestQuoteFromSubtitles({
        movieTitle: request.movieTitle,
        review: request.review,
        language: request.language,
        subtitles: subtitleContent.cues,
      });
    }

    const candidates =
      await this.postcardRepository.findPublicQuoteCandidates({
        movieId: request.movieId,
        movieTitle: request.movieTitle,
      });

    return this.openAiService.suggestQuote({
      ...request,
      candidates,
    });
  }

  private async tryFetchSubtitleContent(
    request: CreatePostcardQuoteSuggestionRequestDto,
  ): Promise<OpenSubtitlesSubtitleContent | null> {
    try {
      const searchResult = await this.openSubtitlesService.searchSubtitles({
        query: request.movieTitle.trim(),
        languages: request.language?.trim() || "en,ko",
        type: "movie",
      });

      const subtitle = this.selectSubtitleSearchItem(
        searchResult.items,
        request.language,
      );

      if (!subtitle) {
        return null;
      }

      const download = await this.openSubtitlesService.downloadSubtitle({
        file_id: subtitle.fileId,
      });

      return await this.openSubtitlesService.fetchSubtitleContent(download);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.warn(`OpenSubtitles 자막 처리 실패: ${message}`);
      return null;
    }
  }

  private selectSubtitleSearchItem(
    items: OpenSubtitlesSubtitleSearchItem[],
    language?: string,
  ) {
    const requestedLanguage = language?.trim().toLowerCase();

    return (
      (requestedLanguage
        ? items.find(
            (item) => item.language.toLowerCase() === requestedLanguage,
          )
        : undefined) ??
      items.find((item) => item.language.toLowerCase() === "en") ??
      items.find(
        (item) => !item.aiTranslated && !item.machineTranslated,
      ) ??
      items[0]
    );
  }

  async findPublicFeed(
    userId: string | undefined,
    request: GetPostcardFeedRequestDto,
  ): Promise<CursorPage<DomainPostcard>> {
    const pageSize = Math.min(request.pageSize ?? 20, 50);
    return this.postcardRepository.findPublicFeed(
      userId,
      request.cursor,
      pageSize,
    );
  }

  async findById(
    userId: string | undefined,
    postcardId: string,
  ): Promise<DomainPostcard> {
    const postcard = await this.postcardRepository.findById(postcardId, userId);

    if (!postcard) {
      throw new NotFoundException("엽서를 찾을 수 없습니다.");
    }

    return postcard;
  }

  async update(
    userId: string,
    postcardId: string,
    request: UpdatePostcardRequestDto,
  ): Promise<DomainPostcard> {
    const postcard = await this.postcardRepository.update({
      postcardId,
      userId,
      type: request.type,
      quoteSource: request.quoteSource,
      content: request.content,

      metadata: request.metadata,
      style: request.style,

      media: request.media?.map((media) => ({
        type: media.type,
        url: media.url ?? null,
        storageKey: media.storageKey ?? null,
        altText: media.altText ?? null,
        sortOrder: media.sortOrder ?? 0,
      })),

      backgroundStyle: request.backgroundStyle,
      backgroundImageKey: request.backgroundImageKey,
      visibility: request.visibility,
    });

    if (!postcard) {
      throw new NotFoundException("수정할 엽서를 찾을 수 없습니다.");
    }

    return postcard;
  }

  async publish(
    userId: string,
    postcardId: string,
  ): Promise<DomainPostcard> {
    const postcard = await this.postcardRepository.publish(postcardId, userId);

    if (!postcard) {
      throw new NotFoundException("발행할 엽서를 찾을 수 없습니다.");
    }

    return postcard;
  }

  async findMine(
    userId: string,
    request: GetPostcardFeedRequestDto,
  ): Promise<CursorPage<DomainPostcard>> {
    const pageSize = Math.min(request.pageSize ?? 20, 50);

    return this.postcardRepository.findMine(userId, request.cursor, pageSize);
  }

  async remove(userId: string, postcardId: string): Promise<void> {
    const deleted = await this.postcardRepository.softDelete(
      postcardId,
      userId,
    );

    if (!deleted) {
      throw new NotFoundException("삭제할 엽서를 찾을 수 없습니다.");
    }
  }
  async create(
    userId: string,
    request: CreatePostcardRequestDto,
  ): Promise<DomainPostcard> {
    return this.postcardRepository.create({
      userId,
      movieId: request.movieId,
      type: request.type,
      source: PostcardSource.USER,
      quoteSource: request.quoteSource,
      content: request.content,

      metadata: request.metadata,
      style: request.style,

      media: request.media?.map((media) => ({
        type: media.type,
        url: media.url ?? null,
        storageKey: media.storageKey ?? null,
        altText: media.altText ?? null,
        sortOrder: media.sortOrder ?? 0,
      })),

      backgroundStyle: request.backgroundStyle ?? null,
      backgroundImageKey: request.backgroundImageKey ?? null,
      visibility: request.visibility ?? PostcardVisibility.PRIVATE,
    });
  }

  async createComment(
    postcardId: string,
    userId: string,
    request: CreatePostcardCommentRequestDto,
  ): Promise<PostcardCommentWithUser> {
    const comment = await this.postcardRepository.createComment({
      postcardId,
      userId,
      content: request.content,
      parentId: request.parentId,
    });

    if (!comment) {
      throw new NotFoundException(
        "댓글을 작성할 수 있는 공개 엽서를 찾을 수 없습니다.",
      );
    }

    return comment;
  }

  async deleteComment(
    postcardId: string,
    commentId: string,
    userId: string,
  ): Promise<void> {
    const deleted = await this.postcardRepository.deleteComment(
      postcardId,
      commentId,
      userId,
    );

    if (!deleted) {
      throw new NotFoundException("삭제할 댓글을 찾을 수 없습니다.");
    }
  }

  async updateComment(
    postcardId: string,
    commentId: string,
    userId: string,
    request: UpdatePostcardCommentRequestDto,
  ): Promise<PostcardCommentWithUser> {
    const comment = await this.postcardRepository.updateComment({
      postcardId,
      commentId,
      userId,
      content: request.content,
    });

    if (!comment) {
      throw new NotFoundException("수정할 댓글을 찾을 수 없습니다.");
    }

    return comment;
  }

  async findComments(
    postcardId: string,
    request: GetPostcardCommentsRequestDto,
  ): Promise<CursorPage<PostcardCommentWithUser>> {
    const pageSize = Math.min(request.pageSize ?? 20, 50);

    return this.postcardRepository.findComments(
      postcardId,
      request.cursor,
      pageSize,
    );
  }

  async addReaction(
    userId: string,
    postcardId: string,
    request: CreatePostcardReactionRequestDto,
  ) {
    const result = await this.postcardRepository.createReaction({
      postcardId,
      userId,
      emoji: request.emoji,
    });

    if (!result) {
      throw new NotFoundException("반응을 추가할 엽서를 찾을 수 없습니다.");
    }

    return result;
  }

  async removeReaction(userId: string, postcardId: string, emoji: string) {
    const result = await this.postcardRepository.removeReaction(
      postcardId,
      userId,
      emoji,
    );

    if (!result) {
      throw new NotFoundException("반응을 삭제할 엽서를 찾을 수 없습니다.");
    }

    return result;
  }

  async addBookmark(userId: string, postcardId: string): Promise<void> {
    const added = await this.postcardRepository.addBookmark(postcardId, userId);

    if (!added) {
      throw new NotFoundException("북마크할 엽서를 찾을 수 없습니다.");
    }
  }

  async removeBookmark(userId: string, postcardId: string): Promise<void> {
    await this.postcardRepository.removeBookmark(postcardId, userId);
  }

  async report(
    userId: string,
    postcardId: string,
    request: CreatePostcardReportRequestDto,
  ): Promise<void> {
    const report = await this.postcardRepository.createReport({
      postcardId,
      reporterId: userId,
      reason: request.reason,
    });

    if (!report) {
      throw new NotFoundException("신고할 공개 엽서를 찾을 수 없습니다.");
    }

    if (report.reporterId === userId && report.status !== "PENDING") {
      throw new ConflictException("이미 처리 중인 신고가 있습니다.");
    }
  }

  async share(
    userId: string | undefined,
    postcardId: string,
    request: CreatePostcardShareRequestDto,
  ) {
    const result = await this.postcardRepository.createShare({
      postcardId,
      userId: userId ?? null,
      channel: request.channel,
    });

    if (!result) {
      throw new NotFoundException("공유할 공개 엽서를 찾을 수 없습니다.");
    }

    return result;
  }

  async findNotifications(
    userId: string,
    request: GetPostcardNotificationsRequestDto,
  ) {
    const pageSize = Math.min(request.pageSize ?? 20, 50);

    return this.postcardRepository.findNotifications(
      userId,
      request.cursor,
      pageSize,
      request.unreadOnly ?? false,
    );
  }

  async markNotificationAsRead(
    userId: string,
    notificationId: string,
  ): Promise<void> {
    const updated = await this.postcardRepository.markNotificationAsRead(
      notificationId,
      userId,
    );

    if (!updated) {
      throw new NotFoundException("읽음 처리할 알림을 찾을 수 없습니다.");
    }
  }
}
