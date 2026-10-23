import { Injectable, Logger } from "@nestjs/common";

import { MailService } from "@/modules/auth/mail.service";
import { ExpoPushService } from "@/modules/notifications/expo-push.service";
import { PushTokenService } from "@/modules/notifications/push-token.service";

import { UserMovieNotificationRepository } from "./repositories/user-movie-notification.repository";

@Injectable()
export class MovieReleaseNotificationService {
  private readonly logger = new Logger(MovieReleaseNotificationService.name);

  constructor(
    private readonly notificationRepository: UserMovieNotificationRepository,
    private readonly mailService: MailService,
    private readonly expoPushService: ExpoPushService,
    private readonly pushTokenService: PushTokenService,
  ) {}

  async sendDueReleaseNotifications(now = new Date()) {
    const notifications =
      await this.notificationRepository.findDueReleaseNotifications(now);

    let sendCount = 0;
    let failedCount = 0;

    for (const notification of notifications) {
      const releaseDate = notification.release?.releaseDate;
      const movieId = notification.movie.id;
      const movieTitle = notification.movie.titles[0]?.title ?? "영화";
      const email = notification.user.email;

      if (!releaseDate) {
        continue;
      }

      try {
        if (email) {
          await this.mailService.sendMovieReleaseNotificationEmail({
            to: email,
            movieId,
            movieTitle,
            releaseDate,
          });
        }

        const pushTokens = await this.pushTokenService.findTokensByUserId(
          notification.user.id,
        );

        if (pushTokens.length > 0) {
          await this.expoPushService.send(
            pushTokens.map(({ token }) => ({
              to: token,
              title: "개봉 알림",
              body: `${movieTitle}이(가) 개봉했습니다.`,
              sound: "default",
              data: {
                movieId,
                route: `/movies/${movieId}`,
                releaseDate: releaseDate.toISOString(),
              },
            })),
          );
        }

        await this.notificationRepository.marksNotified(notification.id);
        sendCount += 1;
      } catch (error) {
        failedCount += 1;

        const message = error instanceof Error ? error.message : String(error);

        this.logger.error(
          `개봉 알림 발송 실패: ${notification.id} - ${message}`,
        );
      }
    }

    if (failedCount > 0) {
      throw new Error(`개봉 알림 ${failedCount}건 발송 실패`);
    }

    return {
      totalCount: notifications.length,
      sendCount,
      failedCount,
    };
  }
}
