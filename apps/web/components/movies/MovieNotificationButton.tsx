"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, BellRing } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppModal } from "@/components/ui/app-modal";
import {
  useSubscribeMovieNotification,
  useUnsubscribeMovieNotification,
} from "@/lib/queries/movie-notification.mutation";
import { movieNotificationQueryOptions } from "@/lib/queries/movie-notification.query";
import { useAuthStore } from "@/stores/auth.store";

type MovieNotificationButtonProps = {
  movieId: string;
};

export function MovieNotificationButton({
  movieId,
}: MovieNotificationButtonProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [loginRequired, setLoginRequired] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState(false);

  const notificationQuery = useQuery({
    ...movieNotificationQueryOptions(movieId),
    enabled: Boolean(user),
  });
  const subscribeMutation = useSubscribeMovieNotification(movieId);
  const unsubscribeMutation = useUnsubscribeMovieNotification(movieId);

  const enabled = notificationQuery.data?.enabled ?? false;
  const isPending =
    notificationQuery.isLoading ||
    subscribeMutation.isPending ||
    unsubscribeMutation.isPending;

  const toggleNotification = () => {
    if (!user) {
      setLoginRequired(true);
      return;
    }

    if (enabled) {
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
        description="개봉 알림은 로그인 후 신청할 수 있습니다."
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

      <button
        type="button"
        onClick={toggleNotification}
        disabled={isPending}
        aria-pressed={enabled}
        aria-label={enabled ? "개봉 알림 해제" : "개봉 알림 신청"}
        title={enabled ? "개봉 알림 해제" : "개봉 알림 신청"}
        className={`group inline-flex h-11 w-11 items-center justify-center gap-0 rounded-xl border px-0 py-0 font-semibold backdrop-blur transition disabled:opacity-50 sm:h-[52px] sm:w-28 sm:min-w-28 sm:max-w-28 sm:flex-none sm:justify-center sm:gap-2 sm:px-3 sm:py-0 ${
          enabled
            ? "border-cinemo-gold/60 bg-cinemo-gold/15 text-cinemo-gold-light"
            : "border-white/20 bg-white/5 text-cinemo-muted hover:border-cinemo-gold/40 hover:text-cinemo-gold-light"
        }`}
      >
        {enabled ? (
          <BellRing className="size-4 text-cinemo-gold" />
          ) : (
            <Bell className="size-4 transition group-hover:scale-110" />
          )}

        <span className="hidden sm:inline">
          {enabled ? "알림 해제" : "알림 설정"}
        </span>
      </button>
    </>
  );
}
