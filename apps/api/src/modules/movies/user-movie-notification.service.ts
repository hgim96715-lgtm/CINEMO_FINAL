import {BadRequestException, Injectable} from "@nestjs/common";

import {MovieNotFoundException} from "@/common/exceptions/movie-not-found.exception";

import {UserMovieNotificationRepository} from "./repositories/user-movie-notification.repository";
import {ActivityService} from "@/modules/activity/activity.service";
import {UserActivityType} from "@prisma/client";

@Injectable()
export class UserMovieNotificationService {
  constructor(
    private readonly notificationRepository: UserMovieNotificationRepository,
    private readonly activityService: ActivityService,
  ) {}

  async subscribe(userId: string, movieId: string) {
    const movie = await this.notificationRepository.findMovie(movieId);

    if (!movie) {
      throw new MovieNotFoundException(movieId);
    }

    const release =
      await this.notificationRepository.findUpcomingRelease(movieId);

    if (!release) {
      throw new BadRequestException(
        "개봉 예정 영화만 알림 신청할 수 있습니다.",
      );
    }

    const result = await this.notificationRepository.enable(
      userId,
      movieId,
      release.id,
    );
    void this.activityService.record({
      userId,
      type: UserActivityType.MOVIE_NOTIFICATION_SUBSCRIBE,
      targetType: "movie",
      targetId: movieId,
    });
    return result;
  }

  async unsubscribe(userId: string, movieId: string) {
    const notification = await this.notificationRepository.findByUserAndMovie(
      userId,
      movieId,
    );

    if (!notification) {
      throw new BadRequestException("신청한 알림이 없습니다.");
    }

    const result = await this.notificationRepository.disable(userId, movieId);
    void this.activityService.record({
      userId,
      type: UserActivityType.MOVIE_NOTIFICATION_UNSUBSCRIBE,
      targetType: "movie",
      targetId: movieId,
    });
    return result;
  }

  async findStatus(userId: string, movieId: string) {
    const notification = await this.notificationRepository.findByUserAndMovie(
      userId,
      movieId,
    );

    return {
      movieId,
      enabled: notification?.enabled ?? false,
      releaseDate: notification?.release?.releaseDate ?? null,
    };
  }
  
  async findMyReleaseNotifications(userId: string) {
    return this.notificationRepository.findEnabledReleasNotifications(userId);
  }
}
