"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { apiClient } from "@/lib/api/apiClient";

type VisitDay = {
  day: string;
  channels: {
    channel: "web" | "app";
    visitors: number;
    guestVisitors: number;
    visits: number;
  }[];
};

const formatNumber = new Intl.NumberFormat("ko-KR");

export default function AdminVisitsPage() {
  const summary = useQuery({
    queryKey: ["admin", "visits"],
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get<VisitDay[]>("/admin/visits", { signal });
      return data;
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <AdminNavigation />
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-cinemo-text">방문 현황</h1>
        <p className="mt-3 text-sm text-cinemo-muted">
          한국 시간 기준 최근 7일. 방문자는 브라우저 또는 앱 설치 단위로 하루에 한 번 집계하며, 비로그인 방문자를 포함함.
        </p>
        <p className="mt-1 text-sm text-cinemo-muted">
          방문 횟수는 웹 문서를 새로 열거나 앱을 새로 실행할 때마다 집계함.
        </p>
      </header>
      {summary.isPending && <p className="text-cinemo-muted">방문 현황을 불러오는 중...</p>}
      {summary.isError && <p className="text-red-300">방문 현황을 불러오지 못했습니다.</p>}
      <div className="space-y-4">
        {summary.data?.map(({ day, channels }) => (
          <section key={day} className="rounded-2xl border border-white/10 p-4 sm:p-6">
            <h2 className="mb-4 font-semibold text-cinemo-text"><time dateTime={day}>{day}</time></h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {channels.map(({ channel, visitors, guestVisitors, visits }) => (
                <div key={channel} className="rounded-xl bg-white/5 p-4">
                  <h3 className="mb-3 font-semibold text-cinemo-gold-light">{channel === "web" ? "웹" : "모바일 앱"}</h3>
                  <dl className="grid grid-cols-3 gap-2 text-sm text-cinemo-muted">
                    {[
                      ["방문자", visitors],
                      ["비로그인 방문자", guestVisitors],
                      ["방문 횟수", visits],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd className="mt-1 text-xl font-semibold tabular-nums text-cinemo-text">
                          {formatNumber.format(Number(value))}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
