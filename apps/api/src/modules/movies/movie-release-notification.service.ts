import { Injectable, Logger } from "@nestjs/common";

import { MailService } from "@/modules/auth/mail.service";
import { ExpoPushService } from "@/modules/notifications/expo-push.service";
import { PushTokenService } from "@/modules/notifications/push-token.service";

import { UserMovieNotificationRepository } from "./repositories/user-movie-notification.repository";

type ReleaseNotificationTiming = "day-before" | "day-of";

const getSeoulDateKey = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return [
    parts.find((part) => part.type === "year")?.value,
    parts.find((part) => part.type === "month")?.value,
    parts.find((part) => part.type === "day")?.value,
  ].join("-");
};

const addDays = (dateKey: string, days: number) => {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

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
    const today = getSeoulDateKey(now);
    const tomorrow = addDays(today, 1);

    let sendCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const notification of notifications) {
      const releaseDate = notification.release?.releaseDate;
      const movieId = notification.movie.id;
      const movieTitle = notification.movie.titles[0]?.title ?? "영화";
      const email = notification.user.email;
      const releaseDateKey = releaseDate
        ? getSeoulDateKey(releaseDate)
        : undefined;
      const timing: ReleaseNotificationTiming | null =
        releaseDateKey === today
          ? "day-of"
          : releaseDateKey === tomorrow
            ? "day-before"
            : null;

      if (!releaseDate || !timing) {
        continue;
      }

      try {
        if (email) {
          await this.mailService.sendMovieReleaseNotificationEmail({
            to: email,
            movieId,
            movieTitle,
            releaseDate,
            timing,
          });
        }

        const pushTokens = await this.pushTokenService.findTokensByUserId(
          notification.user.id,
        );
        let hasPushDelivery = false;

        if (pushTokens.length > 0) {
          const tickets = await this.expoPushService.send(
            pushTokens.map(({ token }) => ({
              to: token,
              title: timing === "day-before" ? "내일 개봉 알림" : "오늘 개봉 알림",
              body:
                timing === "day-before"
                  ? `${movieTitle}이(가) 내일 개봉합니다.`
                  : `${movieTitle}이(가) 오늘 개봉했습니다.`,
              sound: "default",
              data: {
                movieId,
                route: `/movies/${movieId}`,
                releaseDate: releaseDate.toISOString(),
                timing,
              },
            })),
          );
          hasPushDelivery = tickets.some((ticket) => ticket.status === "ok");
        }

        if (!email && !hasPushDelivery) {
          skippedCount += 1;
          this.logger.warn(
            `개봉 알림 전달 수단 없음: ${notification.id}`,
          );
          continue;
        }

        await this.notificationRepository.marksNotified(
          notification.id,
          timing,
        );
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
      skippedCount,
    };
  }
}
