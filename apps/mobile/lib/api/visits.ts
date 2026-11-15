import { randomUUID } from "expo-crypto";
import * as SecureStore from "expo-secure-store";

import { apiClient } from "./apiClient";

const storageKey = "cinemo.visit-id";
const visitId = randomUUID();
let recorded = false;

export type AppServiceEventType =
  | "movie_detail_open"
  | "record_intent"
  | "login_intent"
  | "postcard_share_intent"
  | "app_store_open"
  | "cinema_search_intent";

async function getVisitorId() {
  const visitorId = (await SecureStore.getItemAsync(storageKey)) ?? randomUUID();
  await SecureStore.setItemAsync(storageKey, visitorId);
  return visitorId;
}

export async function recordAppVisit() {
  if (recorded) return;
  recorded = true;

  try {
    const visitorId = await getVisitorId();
    await apiClient.post("/visits", { channel: "app", visitorId, visitId });
  } catch {
    // 방문 기록 실패는 앱 실행에 영향을 주지 않는다.
  }
}

export async function recordAppEvent(type: AppServiceEventType) {
  try {
    const visitorId = await getVisitorId();
    await apiClient.post("/events", { channel: "app", visitorId, type });
  } catch {
    // 통계 전송 실패가 사용자의 클릭 흐름을 막지 않는다.
  }
}
