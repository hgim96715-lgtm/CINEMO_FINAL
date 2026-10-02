"use client";

import { CircleAlert, RefreshCw } from "lucide-react";

type ApiErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function ApiErrorState({
  message = "요청을 처리하지 못했습니다.",
  onRetry,
}: ApiErrorStateProps) {
  return (
    <section role="alert">
      <CircleAlert size={32} aria-hidden="true" />
      <h2>잠시 문제가 발생했어요.</h2>
      <p>{message}</p>

      {onRetry && (
        <button type="button" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" />
          다시 시도
        </button>
      )}
    </section>
  );
}
