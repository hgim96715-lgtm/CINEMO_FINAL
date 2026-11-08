import { randomUUID } from "expo-crypto";
import * as SecureStore from "expo-secure-store";

import { apiClient } from "./apiClient";

const storageKey = "cinemo.visit-id";
const visitId = randomUUID();
let recorded = false;

export async function recordAppVisit() {
  if (recorded) return;
  recorded = true;

  try {
    const visitorId = (await SecureStore.getItemAsync(storageKey)) ?? randomUUID();
    await SecureStore.setItemAsync(storageKey, visitorId);
    await apiClient.post("/visits", { channel: "app", visitorId, visitId });
  } catch {
    // 방문 기록 실패는 앱 실행에 영향을 주지 않는다.
  }
}
