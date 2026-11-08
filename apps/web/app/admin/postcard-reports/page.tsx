"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { apiClient } from "@/lib/api/apiClient";

type ReportTarget = { content: string; user: { nickname: string } };
type PostcardReport = {
  id: string;
  reason: string;
  createdAt: string;
  reporter: { nickname: string };
  postcard: ReportTarget;
  comment: ReportTarget | null;
};

export default function PostcardReportsPage() {
  const queryClient = useQueryClient();
  const queryKey = ["admin", "postcard-reports"];
  const reports = useQuery({
    queryKey,
    queryFn: async ({ signal }) => (await apiClient.get<PostcardReport[]>("/admin/postcard-reports", { signal })).data,
  });
  const resolve = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "hide" | "dismiss" }) =>
      apiClient.patch(`/admin/postcard-reports/${id}`, { action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <AdminNavigation />
      <h1 className="mb-6 text-3xl font-bold text-cinemo-text">엽서·댓글 신고</h1>
      {reports.isPending && <p>신고를 불러오는 중…</p>}
      {reports.isError && <p role="alert">신고 목록을 열 수 없음.</p>}
      {resolve.isError && <p role="alert" className="mb-4 text-red-300">처리하지 못했음. 다시 시도할 수 있음.</p>}
      {reports.data?.length === 0 && <p>처리할 신고가 없음.</p>}
      <div className="space-y-4">
        {reports.data?.map((report) => {
          const target = report.comment ?? report.postcard;
          return (
            <article key={report.id} className="space-y-3 rounded-2xl border border-white/10 p-5">
              <h2 className="font-semibold text-cinemo-text">{report.comment ? "댓글" : "엽서"} · {target.user.nickname}</h2>
              <p className="whitespace-pre-wrap break-words text-cinemo-text">{target.content}</p>
              <p className="text-sm text-cinemo-muted">신고 사유 {report.reason} · 신고자 {report.reporter.nickname}</p>
              <p className="text-xs text-cinemo-muted">
                {new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(report.createdAt))}
              </p>
              <div className="flex gap-3">
                <button type="button" className="rounded-lg border border-white/20 px-3 py-2" disabled={resolve.isPending}
                  onClick={() => resolve.mutate({ id: report.id, action: "dismiss" })}>기각</button>
                <button type="button" className="rounded-lg border border-red-400/40 px-3 py-2 text-red-300" disabled={resolve.isPending}
                  onClick={() => {
                    if (window.confirm("신고된 콘텐츠를 숨길까요?")) resolve.mutate({ id: report.id, action: "hide" });
                  }}>콘텐츠 숨기기</button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
