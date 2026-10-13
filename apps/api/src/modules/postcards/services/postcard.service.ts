import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  PostcardComment,
  PostcardSource,
  PostcardVisibility,
} from "@prisma/client";
import type { Postcard as DomainPostcard } from "../domain/postcard.types";
import type { CursorPage } from "../repositories/postcard.repository";
import { PostcardRepository } from "../repositories/postcard.repository";
import { CreatePostcardRequestDto } from "@/modules/postcards/dto/requests/create-postcard-request.dto";
import { GetPostcardFeedRequestDto } from "@/modules/postcards/dto/requests/get-postcard-feed-request.dto";
import { CreatePostcardCommentRequestDto } from "@/modules/postcards/dto/requests/create-postcard-comment-request.dto";
import { GetPostcardCommentsRequestDto } from "@/modules/postcards/dto/requests/get-postcard-comments-request.dto";
import { UpdatePostcardRequestDto } from "@/modules/postcards/dto/requests/update-postcard-request.dto";
import { CreatePostcardReactionRequestDto } from "@/modules/postcards/dto/requests/create-postcard-reaction-request.dto";
import { CreatePostcardReportRequestDto } from "@/modules/postcards/dto/requests/create-postcard-report-request.dto";
import { GetPostcardNotificationsRequestDto } from "@/modules/postcards/dto/requests/get-postcard-notifications-request.dto";
import { CreatePostcardShareRequestDto } from "@/modules/postcards/dto/requests/create-postcard-share-request.dto";

@Injectable()
export class PostcardService {
  constructor(private readonly postcardRepository: PostcardRepository) {}
  async findPublicFeed(
    request: GetPostcardFeedRequestDto,
  ): Promise<CursorPage<DomainPostcard>> {
    const pageSize = Math.min(request.pageSize ?? 20, 50);
    return this.postcardRepository.findPublicFeed(request.cursor, pageSize);
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
  ): Promise<PostcardComment> {
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

  async findComments(
    postcardId: string,
    request: GetPostcardCommentsRequestDto,
  ): Promise<CursorPage<PostcardComment>> {
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
