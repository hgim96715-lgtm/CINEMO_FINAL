"use client";

import { useQuery } from "@tanstack/react-query";

import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { getConversionRows } from "@/features/admin/conversions/conversion.api";
import { summarizeConversionRows } from "@/features/admin/conversions/conversion.mapper";
import {
  conversionMetrics,
  formatConversionNumber,
  formatConversionRate,
} from "@/features/admin/conversions/conversion.presentation";

export default function AdminConversionsPage() {
  const summary = useQuery({
    queryKey: ["admin", "conversions"],
    queryFn: ({ signal }) => getConversionRows(signal),
  });
  const totals = summary.data ? summarizeConversionRows(summary.data) : null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <AdminNavigation />
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-cinemo-text">유입·전환 현황</h1>
        <p className="mt-3 text-sm leading-6 text-cinemo-muted">
          한국 시간 기준 최근 7일. 같은 방문자가 같은 행동을 여러 번 눌러도 하루 한 번만 집계함.
        </p>
      </header>

      {summary.isPending && <p className="text-cinemo-muted">전환 현황을 불러오는 중...</p>}
      {summary.isError && <p className="text-red-300">전환 현황을 불러오지 못했습니다.</p>}

      {totals && (
        <section className="mb-8 rounded-2xl border border-cinemo-gold/35 bg-cinemo-surface p-4 sm:p-6">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="font-semibold text-cinemo-text">최근 7일 전체</h2>
            <span className="text-sm text-cinemo-muted">날짜·채널별 합계</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl bg-white/5 p-4">
              <p className="text-sm text-cinemo-muted">방문자</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-cinemo-text">{formatConversionNumber(totals.visitors)}</p>
            </article>
            {conversionMetrics.slice(0, 3).map(({ label, countKey, rateKey, base }) => (
              <article key={countKey} className="rounded-xl bg-white/5 p-4">
                <p className="text-sm text-cinemo-muted">{label}</p>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <p className="text-2xl font-semibold tabular-nums text-cinemo-text">{formatConversionNumber(totals[countKey])}</p>
                  <p className="text-sm font-semibold tabular-nums text-cinemo-gold-light">{formatConversionRate(totals.rates[rateKey])}</p>
                </div>
                <p className="mt-1 text-xs text-cinemo-muted">{base}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-4">
        {summary.data?.map((row) => (
          <section key={`${row.day}-${row.channel}`} className="rounded-2xl border border-white/10 p-4 sm:p-6">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="font-semibold text-cinemo-text"><time dateTime={row.day}>{row.day}</time></h2>
              <span className="text-sm font-semibold text-cinemo-gold-light">{row.channel === "web" ? "웹" : "모바일 앱"}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <article className="rounded-xl bg-white/5 p-4">
                <p className="text-sm text-cinemo-muted">방문자</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-cinemo-text">{formatConversionNumber(row.visitors)}</p>
              </article>
              {conversionMetrics.map(({ label, countKey, rateKey, base }) => (
                <article key={countKey} className="rounded-xl bg-white/5 p-4">
                  <p className="text-sm text-cinemo-muted">{label}</p>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <p className="text-2xl font-semibold tabular-nums text-cinemo-text">{formatConversionNumber(row[countKey])}</p>
                    <p className="text-sm font-semibold tabular-nums text-cinemo-gold-light">{formatConversionRate(row.rates[rateKey])}</p>
                  </div>
                  <p className="mt-1 text-xs text-cinemo-muted">{base}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
