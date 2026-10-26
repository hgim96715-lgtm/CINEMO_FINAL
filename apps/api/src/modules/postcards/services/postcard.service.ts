import {
  BadGatewayException,
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
import { TmdbService } from "@/integrations/tmdb/tmdb.service";
import { MoviesService } from "@/modules/movies/movies.service";
import type {
  OpenSubtitlesSubtitleContent,
  OpenSubtitlesSubtitleSearchItem,
} from "@/integrations/opensubtitles/opensubtitles.types";
import { SubdlService } from "@/integrations/subdl/subdl.service";
import {
  isSameSubtitleLanguage,
  normalizeSubtitleLanguage,
} from "@/integrations/subtitles/subtitle-language";

const COUNTRY_LANGUAGE_MAP: Record<string, string> = {
  AR: "es",
  AT: "de",
  AU: "en",
  BR: "pt",
  CA: "en",
  CH: "de",
  CN: "zh",
  DE: "de",
  ES: "es",
  FR: "fr",
  GB: "en",
  HK: "zh",
  IE: "en",
  IN: "hi",
  IT: "it",
  JP: "ja",
  KR: "ko",
  MX: "es",
  NZ: "en",
  PT: "pt",
  RU: "ru",
  TW: "zh",
  US: "en",
};

type SubtitleSearchContext = {
  language: string | null;
  tmdbId: number | null;
  imdbId: number | null;
  originalTitle: string | null;
  searchTitles: string[];
};

@Injectable()
export class PostcardService {
  private readonly logger = new Logger(PostcardService.name);

  constructor(
    private readonly postcardRepository: PostcardRepository,
    private readonly openAiService: OpenAiService,
    private readonly openSubtitlesService: OpenSubtitlesService,
    private readonly subdlService: SubdlService,
    private readonly moviesService: MoviesService,
    private readonly tmdbService: TmdbService,
  ) {}

  async suggestQuote(
    request: CreatePostcardQuoteSuggestionRequestDto,
  ): Promise<SuggestQuoteResult> {
    const subtitleContext = await this.findSubtitleSearchContext(
      request.movieId,
    );
    const subtitleContent = await this.tryFetchSubtitleContent(
      request,
      subtitleContext,
    );

    if (subtitleContent?.cues.length) {
      const publicQuoteCandidates =
        await this.postcardRepository.findPublicQuoteCandidates({
          movieId: request.movieId,
          movieTitle: request.movieTitle,
        });

      return this.openAiService.suggestQuoteFromSubtitles({
        movieTitle: request.movieTitle,
        review: request.review,
        language: subtitleContext.language ?? request.language ?? undefined,
        subtitles: subtitleContent.cues,
        publicQuoteCandidates,
      });
    }

    // 원문 언어를 알고 있는데 해당 언어 자막을 찾지 못한 경우
    // 영어 등 다른 언어의 공개 인용구를 잘못 반환하지 않음.
    if (subtitleContext.language) {
      throw new BadGatewayException(
        `${subtitleContext.language} 원문 자막을 찾지 못했습니다.`,
      );
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
    subtitleContext: SubtitleSearchContext,
  ): Promise<OpenSubtitlesSubtitleContent | null> {
    const openSubtitlesContent = await this.tryFetchOpenSubtitlesContent(
      request,
      subtitleContext,
    );

    if (openSubtitlesContent?.cues.length) {
      return openSubtitlesContent;
    }

    return this.subdlService.searchAndFetchSubtitle({
      movieTitle: subtitleContext.originalTitle ?? request.movieTitle,
      tmdbId: subtitleContext.tmdbId,
      imdbId: subtitleContext.imdbId,
      language: subtitleContext.language ?? request.language?.trim() ?? null,
    });
  }

  private async tryFetchOpenSubtitlesContent(
    request: CreatePostcardQuoteSuggestionRequestDto,
    subtitleContext: SubtitleSearchContext,
  ): Promise<OpenSubtitlesSubtitleContent | null> {
    try {
      const preferredLanguage =
        normalizeSubtitleLanguage(
          subtitleContext.language ?? request.language?.trim() ?? null,
        );
      const searchParams = [
        ...(subtitleContext.imdbId
          ? [{ type: "movie" as const, imdb_id: subtitleContext.imdbId }]
          : []),
        ...(subtitleContext.tmdbId
          ? [{ type: "movie" as const, tmdb_id: subtitleContext.tmdbId }]
          : []),
        ...[
          ...subtitleContext.searchTitles,
          request.movieTitle.trim(),
        ]
          .filter((title): title is string => Boolean(title?.trim()))
          .filter(
            (title, index, titles) =>
              titles.findIndex(
                (candidate) => candidate.toLowerCase() === title.toLowerCase(),
              ) === index,
          )
          .map((query) => ({ type: "movie" as const, query })),
      ];

      let subtitle: OpenSubtitlesSubtitleSearchItem | undefined;

      for (const params of searchParams) {
        const preferredSearchResult =
          await this.openSubtitlesService.searchSubtitles({
            ...params,
            languages: preferredLanguage || "en,ko,ja",
          });

        subtitle = this.selectSubtitleSearchItem(
          preferredSearchResult.items,
          preferredLanguage ?? undefined,
        );

        if (subtitle) {
          break;
        }

        if (preferredLanguage) {
          const fallbackSearchResult =
            await this.openSubtitlesService.searchSubtitles({
              ...params,
              languages: "en,ko,ja",
            });

          subtitle = this.selectSubtitleSearchItem(
            fallbackSearchResult.items,
            preferredLanguage,
          );

          if (subtitle) {
            break;
          }
        }
      }

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

  private isOriginalSubtitle(item: OpenSubtitlesSubtitleSearchItem) {
    return !item.aiTranslated && !item.machineTranslated;
  }

  private async findSubtitleSearchContext(
    movieId?: string,
  ): Promise<SubtitleSearchContext> {
    if (!movieId) {
      return {
        language: null,
        tmdbId: null,
        imdbId: null,
        originalTitle: null,
        searchTitles: [],
      };
    }

    try {
      const movie = await this.moviesService.findById(movieId);
      const tmdbLink = movie.providerLinks.find(
        (link) =>
          link.sourceProvider === "TMDB" &&
          link.matchStatus !== "REJECTED",
      );
      const originalTitle = movie.titles.find(
        (title) => title.titleType === "ORIGINAL" && title.title.trim(),
      )?.title.trim() ?? null;
      const originalTitleLanguage = movie.titles.find(
        (title) =>
          title.titleType === "ORIGINAL" && Boolean(title.languageCode),
      )?.languageCode?.trim().toLowerCase();
      const language =
        originalTitleLanguage ||
        (movie.productionCountryCodes
          .map(
            (countryCode) => COUNTRY_LANGUAGE_MAP[countryCode.toUpperCase()],
          )
          .find(Boolean) ?? null);

      const tmdbId = tmdbLink ? Number(tmdbLink.externalId) : NaN;
      const validTmdbId = Number.isInteger(tmdbId) && tmdbId > 0 ? tmdbId : null;
      let tmdbMovie: Awaited<ReturnType<TmdbService["getMovieDetail"]>> | null = null;

      if (validTmdbId) {
        try {
          tmdbMovie = await this.tmdbService.getMovieDetail(validTmdbId);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(`TMDB 영화 외부 ID 조회 실패: ${message}`);
        }
      }

      const imdbId = tmdbMovie?.imdb_id
        ? Number(tmdbMovie.imdb_id.replace(/^tt/i, ""))
        : NaN;
      const searchTitles = [
        originalTitle,
        tmdbMovie?.original_title,
        tmdbMovie?.title,
      ]
        .filter((title): title is string => Boolean(title?.trim()))
        .filter(
          (title, index, titles) =>
            titles.findIndex(
              (candidate) => candidate.toLowerCase() === title.toLowerCase(),
            ) === index,
        );

      return {
        language: normalizeSubtitleLanguage(language),
        tmdbId: validTmdbId,
        imdbId: Number.isInteger(imdbId) && imdbId > 0 ? imdbId : null,
        originalTitle,
        searchTitles,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.warn(`TMDB 영화 ID 조회 실패: ${message}`);
      return {
        language: null,
        tmdbId: null,
        imdbId: null,
        originalTitle: null,
        searchTitles: [],
      };
    }
  }

  private selectSubtitleSearchItem(
    items: OpenSubtitlesSubtitleSearchItem[],
    language?: string,
  ) {
    const requestedLanguage = normalizeSubtitleLanguage(language);

    if (requestedLanguage) {
      return items.find(
        (item) =>
          isSameSubtitleLanguage(item.language, requestedLanguage) &&
          this.isOriginalSubtitle(item),
      );
    }

    return (
      items.find((item) => this.isOriginalSubtitle(item)) ??
      items.find((item) => isSameSubtitleLanguage(item.language, "en")) ??
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
