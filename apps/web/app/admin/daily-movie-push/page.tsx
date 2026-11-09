"use client";

import { formatDailyMoviePush, formatDailyMovieSchedule, type DailyMoviePushSettings } from "@cinemo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { apiClient, getApiErrorMessage } from "@/lib/api/apiClient";

const queryKey = ["admin", "daily-movie-push"];
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

function PushSettingsForm({ initial }: { initial: DailyMoviePushSettings }) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(initial);
  const preview = formatDailyMoviePush(settings, "그린 북", "자주 본 드라마 장르의 미관람 영화예요.", "☔ 서울에 비 오는 날, 영화 한 편");
  const save = useMutation({
    mutationFn: async () => (await apiClient.patch<DailyMoviePushSettings>("/admin/daily-movie-push", settings)).data,
    onSuccess: (updated) => queryClient.setQueryData(queryKey, updated),
  });

  return (
    <form
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]"
      onSubmit={(event) => { event.preventDefault(); save.mutate(); }}
    >
      <div className="space-y-5 rounded-2xl border border-white/10 p-5">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={settings.enabled}
            onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })} />
          <span>추천 알림 발송 사용</span>
        </label>
        <fieldset>
          <legend className="mb-2 font-medium">발송 요일</legend>
          <div className="flex flex-wrap gap-2">
            {weekdays.map((label, day) => {
              const checked = settings.weekdays.includes(day);
              return (
                <label key={label} className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2">
                  <input type="checkbox" checked={checked}
                    onChange={() => setSettings({
                      ...settings,
                      weekdays: checked ? settings.weekdays.filter((value) => value !== day) : [...settings.weekdays, day],
                    })} />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>
        <label className="grid gap-2 font-medium">
          발송 시간 · 한국 시간
          <select value={settings.hour} onChange={(event) => setSettings({ ...settings, hour: Number(event.target.value) })}
            className="rounded-lg border border-white/15 bg-cinemo-bg-deep px-3 py-2">
            {Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00</option>)}
          </select>
        </label>
        <label className="grid gap-2 font-medium">
          알림 제목
          <input value={settings.title} onChange={(event) => setSettings({ ...settings, title: event.target.value })}
            required maxLength={60} className="rounded-lg border border-white/15 bg-cinemo-bg-deep px-3 py-2" />
        </label>
        <label className="grid gap-2 font-medium">
          알림 본문
          <textarea value={settings.body} onChange={(event) => setSettings({ ...settings, body: event.target.value })}
            required maxLength={180} rows={3} className="rounded-lg border border-white/15 bg-cinemo-bg-deep px-3 py-2" />
        </label>
        <p className="text-sm text-cinemo-muted"><code>{"{movie}"}</code>는 영화 제목, <code>{"{reason}"}</code>은 추천 이유, <code>{"{context}"}</code>는 날씨나 시간대에 맞는 제목으로 바뀜.</p>
        <button type="submit" disabled={save.isPending || !settings.weekdays.length}
          className="rounded-lg bg-cinemo-gold px-4 py-2 font-semibold text-cinemo-bg-deep disabled:opacity-50">
          {save.isPending ? "저장 중…" : "저장"}
        </button>
        {save.isSuccess && <p role="status" className="text-sm text-cinemo-gold-light">저장됨.</p>}
        {save.isError && <p role="alert" className="text-sm text-red-300">{getApiErrorMessage(save.error, "저장하지 못했음.")}</p>}
      </div>

      <section aria-label="알림 미리보기" className="self-start rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-semibold">알림 미리보기</h2>
        <p className="mt-2 text-sm text-cinemo-muted">{formatDailyMovieSchedule(settings.weekdays, settings.hour)}</p>
        <div className="mt-4 rounded-2xl bg-cinemo-bg-deep p-4">
          <p className="text-xs font-semibold text-cinemo-gold-light">CINEMO</p>
          <p className="mt-2 break-words font-semibold">{preview.title}</p>
          <p className="mt-1 whitespace-pre-line break-words text-sm text-cinemo-muted">{preview.body}</p>
        </div>
        <p className="mt-3 text-xs text-cinemo-muted">잠금 화면의 모양과 줄 수는 기기 설정에 따라 달라짐.</p>
      </section>
    </form>
  );
}

export default function DailyMoviePushPage() {
  const settings = useQuery({
    queryKey,
    queryFn: async ({ signal }) => (await apiClient.get<DailyMoviePushSettings>("/admin/daily-movie-push", { signal })).data,
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <AdminNavigation />
      <h1 className="mb-6 text-3xl font-bold">영화 추천 알림</h1>
      {settings.isPending && <p>설정을 불러오는 중…</p>}
      {settings.isError && <p role="alert">추천 알림 설정을 열 수 없음.</p>}
      {settings.data && <PushSettingsForm initial={settings.data} />}
    </main>
  );
}
