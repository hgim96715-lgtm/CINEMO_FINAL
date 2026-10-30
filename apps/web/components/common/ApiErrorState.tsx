"use client";

import { CircleAlert, RefreshCw } from "lucide-react";

type ApiErrorStateProps = {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
};

export function ApiErrorState({
  message = "요청을 처리하지 못했습니다.",
  onRetry,
  compact = false,
}: ApiErrorStateProps) {
  if (compact) {
    return (
      <section
        role="alert"
        className="flex items-center justify-between gap-3 rounded-xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-cinemo-text"
      >
        <div className="flex min-w-0 items-center gap-2">
          <CircleAlert className="size-4 shrink-0 text-red-300" aria-hidden="true" />
          <p className="truncate">{message}</p>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-cinemo-gold-light transition hover:border-cinemo-gold/50 hover:bg-cinemo-gold/10"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            다시 시도
          </button>
        )}
      </section>
    );
  }

  return (
    <section
      role="alert"
      className="mx-auto flex min-h-[calc(100vh-13rem)] max-w-6xl flex-col items-center justify-center px-6 py-24 text-center text-cinemo-text"
    >
      <div className="flex size-16 items-center justify-center rounded-full border border-cinemo-gold/40 bg-cinemo-surface text-cinemo-gold shadow-lg shadow-black/10">
        <CircleAlert size={32} aria-hidden="true" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
        잠시 문제가 발생했어요.
      </h2>
      <p className="mt-3 text-sm leading-6 text-cinemo-muted sm:text-base">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-cinemo-gold px-5 py-3 text-sm font-semibold text-cinemo-bg transition hover:bg-cinemo-gold-light"
        >
          <RefreshCw size={16} aria-hidden="true" />
          다시 시도
        </button>
      )}
    </section>
  );
}
