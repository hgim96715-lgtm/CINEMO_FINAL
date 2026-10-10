"use client";

import { Bell, BellRing, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppModal } from "@/components/ui/app-modal";
import {
  movieRecordQueryOptions,
} from "@/lib/queries/movie-record.query";
import { useUpdateMovieRecord } from "@/lib/queries/movie-record.mutation";
import {
  useSubscribeMovieNotification,
  useUnsubscribeMovieNotification,
} from "@/lib/queries/movie-notification.mutation";
import { movieNotificationQueryOptions } from "@/lib/queries/movie-notification.query";
import { useAuthStore } from "@/stores/auth.store";

type UpcomingMovieActionsProps = {
  movieId: string;
};

export function UpcomingMovieActions({ movieId }: UpcomingMovieActionsProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [loginRequired, setLoginRequired] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState(false);

  const recordQuery = useQuery({
    ...movieRecordQueryOptions(movieId),
    enabled: Boolean(user),
  });
  const updateRecordMutation = useUpdateMovieRecord(movieId);
  const notificationQuery = useQuery({
    ...movieNotificationQueryOptions(movieId),
    enabled: Boolean(user),
  });
  const subscribeMutation = useSubscribeMovieNotification(movieId);
  const unsubscribeMutation = useUnsubscribeMovieNotification(movieId);

  const isFavorite = recordQuery.data?.isFavorite ?? false;
  const notificationEnabled = notificationQuery.data?.enabled ?? false;
  const isFavoritePending = updateRecordMutation.isPending;
  const isNotificationPending =
    subscribeMutation.isPending || unsubscribeMutation.isPending;

  const requireLogin = () => {
    setLoginRequired(true);
  };

  const toggleFavorite = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      requireLogin();
      return;
    }

    updateRecordMutation.mutate({ isFavorite: !isFavorite });
  };

  const toggleNotification = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      requireLogin();
      return;
    }

    if (notificationEnabled) {
      unsubscribeMutation.mutate();
    } else {
      subscribeMutation.mutate(undefined, {
        onSuccess: () => setNotificationSuccess(true),
      });
    }
  };

  return (
    <>
      <AppModal
        open={loginRequired}
        onOpenChange={setLoginRequired}
        title="로그인이 필요합니다"
        description="찜하기와 개봉 알림은 로그인 후 이용할 수 있습니다."
        footer={
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="rounded-lg bg-cinemo-gold px-4 py-2 text-sm font-semibold text-cinemo-bg transition hover:bg-cinemo-gold-light"
          >
            로그인 페이지로 이동
          </button>
        }
      />

      <AppModal
        open={notificationSuccess}
        onOpenChange={setNotificationSuccess}
        title="알림 설정 완료"
        description="개봉 알림 수신 대상에 등록되었습니다."
        footer={
          <button
            type="button"
            onClick={() => setNotificationSuccess(false)}
            className="rounded-lg bg-cinemo-gold px-4 py-2 text-sm font-semibold text-cinemo-bg transition hover:bg-cinemo-gold-light"
          >
            확인
          </button>
        }
      />

      <div className="absolute right-2 top-2 z-10 flex gap-1.5">
        <button
          type="button"
          onClick={toggleFavorite}
          disabled={isFavoritePending}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "찜 해제" : "찜하기"}
          title={isFavorite ? "찜 해제" : "찜하기"}
          className={`inline-flex size-8 items-center justify-center rounded-full border backdrop-blur-md transition disabled:opacity-50 ${
            isFavorite
              ? "border-cinemo-gold/70 bg-cinemo-gold/20 text-cinemo-gold-light"
              : "border-white/20 bg-cinemo-bg/70 text-white/80 hover:border-cinemo-gold/60 hover:text-cinemo-gold-light"
          }`}
        >
          <Heart
            className={`size-4 ${
              isFavorite ? "fill-cinemo-gold text-cinemo-gold" : ""
            }`}
          />
        </button>

        <button
          type="button"
          onClick={toggleNotification}
          disabled={isNotificationPending}
          aria-pressed={notificationEnabled}
          aria-label={notificationEnabled ? "개봉 알림 해제" : "개봉 알림 신청"}
          title={notificationEnabled ? "개봉 알림 해제" : "개봉 알림 신청"}
          className={`inline-flex size-8 items-center justify-center rounded-full border backdrop-blur-md transition disabled:opacity-50 ${
            notificationEnabled
              ? "border-cinemo-gold/70 bg-cinemo-gold/20 text-cinemo-gold-light"
              : "border-white/20 bg-cinemo-bg/70 text-white/80 hover:border-cinemo-gold/60 hover:text-cinemo-gold-light"
          }`}
        >
          {notificationEnabled ? (
            <BellRing className="size-4" />
          ) : (
            <Bell className="size-4" />
          )}
        </button>
      </div>
    </>
  );
}
