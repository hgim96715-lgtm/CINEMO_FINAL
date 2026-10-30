"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Users, Activity, Clock3 } from "lucide-react";
import { Fragment, useState } from "react";

import { adminUsersQueryOptions } from "@/lib/queries/admin-users.query";
import { adminUserActivityQueryOptions } from "@/lib/queries/admin-user-activity.query";

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const activityLabels: Record<string, string> = {
  LOGIN: "로그인",
  LOGOUT: "로그아웃",
  MOVIE_RECORD_UPSERT: "영화 기록 저장·수정",
  MOVIE_RECORD_DELETE: "영화 기록 삭제",
  MOVIE_NOTIFICATION_SUBSCRIBE: "개봉 알림 신청",
  MOVIE_NOTIFICATION_UNSUBSCRIBE: "개봉 알림 해제",
  CINEMA_VISIT_CREATE: "영화관 방문 기록",
  CINEMA_VISIT_DELETE: "영화관 방문 기록 삭제",
  POSTCARD_CREATE: "엽서 작성",
  POSTCARD_UPDATE: "엽서 수정",
  POSTCARD_PUBLISH: "엽서 발행",
  POSTCARD_DELETE: "엽서 삭제",
  POSTCARD_REACTION_ADD: "엽서 반응 추가",
  POSTCARD_REACTION_REMOVE: "엽서 반응 삭제",
  POSTCARD_BOOKMARK_ADD: "엽서 북마크",
  POSTCARD_BOOKMARK_REMOVE: "엽서 북마크 해제",
};

function formatDate(value: string | null) {
  if (!value) return "기록 없음";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "기록 없음" : dateTimeFormatter.format(date);
}

function statusLabel(status: "ACTIVE" | "SUSPENDED" | "DELETED") {
  if (status === "ACTIVE") return "활성";
  if (status === "SUSPENDED") return "정지";
  return "탈퇴";
}

export function AdminUsersTable() {
  const usersQuery = useQuery(adminUsersQueryOptions());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  if (usersQuery.isPending) {
    return <main className="mx-auto max-w-6xl px-6 py-16 text-cinemo-muted">회원 접속 현황을 불러오는 중...</main>;
  }

  if (usersQuery.isError || !usersQuery.data) {
    return <main className="mx-auto max-w-6xl px-6 py-16 text-red-300">회원 접속 현황을 불러오지 못했습니다.</main>;
  }

  const { summary, items } = usersQuery.data;

  return (
    <main className="mx-auto min-h-[calc(100vh-11rem)] max-w-6xl px-6 py-12 sm:py-16">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-[0.32em] text-cinemo-gold">ADMIN</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-cinemo-text sm:text-4xl">회원·접속 현황</h1>
            <p className="mt-3 text-sm text-cinemo-muted">누가 가입했고, 최근 로그인했으며, 현재 접속 세션이 있는지 확인</p>
          </div>
          <button
            type="button"
            onClick={() => void usersQuery.refetch()}
            className="rounded-xl border border-cinemo-gold/30 px-4 py-2 text-sm text-cinemo-gold-light transition hover:bg-cinemo-gold/10"
          >
            새로고침
          </button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={<Users className="size-5" />} label="전체 회원" value={summary.totalUsers} />
        <SummaryCard icon={<ShieldCheck className="size-5" />} label="활성 회원" value={summary.activeUsers} />
        <SummaryCard icon={<Clock3 className="size-5" />} label="최근 24시간 로그인" value={summary.recentLogins} />
        <SummaryCard icon={<Activity className="size-5" />} label="유효 세션" value={summary.activeSessions} />
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#101f21]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs text-cinemo-muted">
              <tr>
                <th className="px-5 py-4 font-medium">회원</th>
                <th className="px-5 py-4 font-medium">상태</th>
                <th className="px-5 py-4 font-medium">최근 로그인</th>
                <th className="px-5 py-4 font-medium">현재 세션</th>
                <th className="px-5 py-4 font-medium">가입일</th>
                <th className="px-5 py-4 font-medium">활동</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {items.map((user) => (
                <Fragment key={user.id}>
                  <tr key={user.id} className="transition hover:bg-white/[0.025]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-cinemo-gold/10 text-cinemo-gold-light">
                        {user.nickname.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-cinemo-text">
                          {user.nickname}
                          {user.isAdmin && <span className="ml-2 text-xs text-cinemo-gold">관리자</span>}
                        </p>
                        <p className="truncate text-xs text-cinemo-muted">{user.email ?? "이메일 없음"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-cinemo-muted">{statusLabel(user.status)}</td>
                  <td className="px-5 py-4 text-cinemo-muted">{formatDate(user.lastLoginAt)}</td>
                  <td className="px-5 py-4">
                    <p className={user.activeSessionCount > 0 ? "font-semibold text-cinemo-teal-light" : "text-cinemo-muted"}>
                      {user.activeSessionCount > 0 ? `${user.activeSessionCount}개 활성` : "접속 없음"}
                    </p>
                    {user.latestSession && (
                      <p className="mt-1 max-w-[260px] truncate text-xs text-cinemo-muted" title={user.latestSession.userAgent ?? undefined}>
                        {user.latestSession.ipAddress ?? "IP 미기록"}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-cinemo-muted">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedUserId((current) =>
                          current === user.id ? null : user.id,
                        )
                      }
                      className="rounded-lg border border-cinemo-gold/25 px-3 py-1.5 text-xs text-cinemo-gold-light transition hover:bg-cinemo-gold/10"
                    >
                      {selectedUserId === user.id ? "닫기" : "활동 보기"}
                    </button>
                  </td>
                  </tr>
                  {selectedUserId === user.id && (
                    <tr key={`${user.id}-activity`}>
                      <td colSpan={6} className="bg-black/10 px-5 py-5">
                        <AdminUserActivityPanel userId={user.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function AdminUserActivityPanel({ userId }: { userId: string }) {
  const activityQuery = useQuery(adminUserActivityQueryOptions(userId));

  if (activityQuery.isPending) {
    return <p className="text-sm text-cinemo-muted">활동 이력을 불러오는 중...</p>;
  }

  if (activityQuery.isError) {
    return <p className="text-sm text-red-300">활동 이력을 불러오지 못했습니다.</p>;
  }

  if (activityQuery.data.length === 0) {
    return <p className="text-sm text-cinemo-muted">기록된 활동이 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-cinemo-text">최근 활동</h3>
        <span className="text-xs text-cinemo-muted">최대 100건</span>
      </div>
      <div className="divide-y divide-white/8 rounded-xl border border-white/8 bg-white/[0.02]">
        {activityQuery.data.map((activity) => (
          <div key={activity.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-cinemo-text">
                {activityLabels[activity.type] ?? activity.type}
              </p>
              <p className="mt-1 text-xs text-cinemo-muted">
                {activity.targetType && `${activity.targetType}${activity.targetId ? ` · ${activity.targetId.slice(0, 8)}` : ""}`}
              </p>
            </div>
            <time className="text-xs text-cinemo-muted">{formatDate(activity.createdAt)}</time>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#101f21] p-5">
      <div className="flex items-center gap-2 text-cinemo-gold">{icon}<span className="text-sm text-cinemo-muted">{label}</span></div>
      <p className="mt-4 text-3xl font-bold tabular-nums text-cinemo-text">{value.toLocaleString("ko-KR")}</p>
    </article>
  );
}
