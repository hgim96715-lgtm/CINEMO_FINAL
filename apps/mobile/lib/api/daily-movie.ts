import { apiClient, getMobileAccessToken } from "./apiClient";

export type DailyMovie = {
  day: string;
  headline?: string;
  weatherSource?: string | null;
  movie: { id: string; title: string; posterUrl: string; genres: string[] };
  copy: string;
  reason?: string;
  hasPreparedCopy?: boolean;
};

export async function getDailyMovie(signal?: AbortSignal) {
  const { data } = await apiClient.get<DailyMovie | null>("/daily-movie", { signal });
  return data;
}

export async function getDailyMoviePreference(signal?: AbortSignal) {
  const { data } = await apiClient.get<{ enabled: boolean }>("/daily-movie/preference", { signal });
  return data;
}

export async function setDailyMoviePreference(enabled: boolean, pushTokenId?: string) {
  const { data } = await apiClient.patch<{ enabled: boolean }>("/daily-movie/preference", {
    enabled, pushTokenId,
  });
  return data;
}

const seoulDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
});
export const getDailyMovieDay = () => seoulDate.format(new Date());

let lastRecorded: { token: string; day: string } | undefined;

export async function recordDailyMovieVisit() {
  const token = getMobileAccessToken();
  const day = getDailyMovieDay();
  if (!token || (lastRecorded?.token === token && lastRecorded.day === day)) return;

  try {
    await apiClient.post("/daily-movie/visit");
    lastRecorded = { token, day };
  } catch {
    // 방문 집계 실패가 앱 이용을 막지 않는다.
  }
}
