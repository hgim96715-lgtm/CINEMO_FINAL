export const serviceEventTypes = [
  "movie_detail_open",
  "record_intent",
  "login_intent",
  "postcard_share_intent",
  "app_store_open",
  "cinema_search_intent",
] as const;

export type ServiceEventType = (typeof serviceEventTypes)[number];

const visitorStorageKey = "cinemo.visit-id";

function getVisitorId() {
  const stored = window.localStorage.getItem(visitorStorageKey);

  if (stored) {
    return stored;
  }

  const visitorId = window.crypto.randomUUID();
  window.localStorage.setItem(visitorStorageKey, visitorId);
  return visitorId;
}

/**
 * 전환 행동은 서버에서 방문자·행동·날짜 조합으로 한 번만 합산한다.
 * 통계가 실패해도 화면의 원래 행동에는 영향을 주지 않는다.
 */
export function recordServiceEvent(type: ServiceEventType) {
  if (typeof window === "undefined" || window.location.pathname.startsWith("/admin")) {
    return;
  }

  try {
    void fetch("/api/v1/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "web",
        visitorId: getVisitorId(),
        type,
      }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // 저장소 접근이 막힌 브라우저에서도 서비스 이용은 계속된다.
  }
}
