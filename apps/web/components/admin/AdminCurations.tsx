"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { ko } from "@daypicker/react/locale";

import type {
  Curation,
  CurationStatus,
  SaveCurationInput,
} from "@/lib/api/curations";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AppModal } from "@/components/ui/app-modal";
import { Calendar } from "@/components/ui/calendar";
import { formatDateValue } from "@/lib/date-utils";
import { searchAdminMovies, type AdminMovie } from "@/lib/api/admin-movies";
import { adminCurationsQueryOptions } from "@/lib/queries/curation.query";
import {
  useCreateAdminCurationMutation,
  useDeleteAdminCurationMutation,
  useUpdateAdminCurationMutation,
} from "@/lib/queries/curation.mutation";

type SelectedMovie = Pick<AdminMovie, "id" | "title" | "posterUrl" | "releaseDate"> & {
  reason: string;
};

type FormState = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  status: CurationStatus;
  startsAt: string;
  endsAt: string;
  sortOrder: string;
  movies: SelectedMovie[];
};

const emptyForm: FormState = {
  slug: "",
  eyebrow: "",
  title: "",
  description: "",
  status: "PUBLISHED",
  startsAt: "",
  endsAt: "",
  sortOrder: "0",
  movies: [],
};

const statusLabels: Record<CurationStatus, string> = {
  DRAFT: "임시저장",
  PUBLISHED: "게시중",
  ARCHIVED: "보관됨",
};

const statusDescriptions: Record<CurationStatus, string> = {
  DRAFT: "관리자만 확인",
  PUBLISHED: "로비에 노출",
  ARCHIVED: "노출하지 않음",
};

function toInputDate(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatKoreanDate(value: string) {
  if (!value) return "날짜 선택";
  const [year, month, day] = value.split("-");
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

function toSeoulStart(value: string) {
  return value ? `${value}T00:00:00+09:00` : null;
}

function toSeoulEnd(value: string) {
  return value ? `${value}T23:59:59.999+09:00` : null;
}

function toForm(curation: Curation): FormState {
  return {
    slug: curation.slug,
    eyebrow: curation.eyebrow,
    title: curation.title,
    description: curation.description ?? "",
    status: curation.status,
    startsAt: toInputDate(curation.startsAt),
    endsAt: toInputDate(curation.endsAt),
    sortOrder: String(curation.sortOrder),
    movies: curation.movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.posterUrl,
      releaseDate: movie.releaseDate,
      reason: movie.reason ?? "",
    })),
  };
}

function toPayload(form: FormState): SaveCurationInput {
  return {
    slug: form.slug.trim(),
    eyebrow: form.eyebrow.trim(),
    title: form.title.trim(),
    description: form.description.trim() || null,
    status: form.status,
    startsAt: toSeoulStart(form.startsAt),
    endsAt: toSeoulEnd(form.endsAt),
    sortOrder: Number(form.sortOrder) || 0,
    movies: form.movies.map((movie, index) => ({
      movieId: movie.id,
      reason: movie.reason.trim() || null,
      sortOrder: index,
    })),
  };
}

export function AdminCurations() {
  const curationsQuery = useQuery(adminCurationsQueryOptions());
  const createMutation = useCreateAdminCurationMutation();
  const updateMutation = useUpdateAdminCurationMutation();
  const deleteMutation = useDeleteAdminCurationMutation();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [movieQuery, setMovieQuery] = useState("");
  const [submittedMovieQuery, setSubmittedMovieQuery] = useState("");
  const [calendarTarget, setCalendarTarget] = useState<"startsAt" | "endsAt" | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>();

  // 일반 영화 검색은 한국 개봉/시청 가능 조건으로 필터링하므로
  // 같은 제목의 작품 중 하나가 검색에서 빠질 수 있음. 관리자 큐레이션에서는
  // 공개 상태와 관계없이 DB의 모든 영화를 ID 기준으로 조회해야 원작·리메이크를
  // 각각 선택할 수 있음.
  const moviesSearchQuery = useQuery({
    queryKey: ["admin", "curation-movie-search", submittedMovieQuery],
    queryFn: () =>
      searchAdminMovies({
        query: submittedMovieQuery,
        visibility: "ALL",
        page: 1,
        limit: 50,
      }),
    enabled: submittedMovieQuery.length > 0,
    retry: false,
  });

  const selectedIds = useMemo(
    () => new Set(form.movies.map((movie) => movie.id)),
    [form.movies],
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMovieQuery("");
    setSubmittedMovieQuery("");
    setCalendarTarget(null);
  };

  const openCalendar = (target: "startsAt" | "endsAt") => {
    const value = form[target] || form.startsAt || form.endsAt;
    setCalendarTarget(target);
    setCalendarMonth(value ? parseDateValue(value) : new Date());
  };

  const selectCalendarDate = (date: Date) => {
    if (!calendarTarget) return;

    setForm((current) => ({
      ...current,
      [calendarTarget]: formatDateValue(date),
    }));
    setCalendarTarget(null);
  };

  const handleMovieSearch = () => {
    setSubmittedMovieQuery(movieQuery.trim());
  };

  const addMovie = (movie: Pick<AdminMovie, "id" | "title" | "posterUrl" | "releaseDate">) => {
    if (selectedIds.has(movie.id)) return;

    setForm((current) => ({
      ...current,
      movies: [
        ...current.movies,
        {
          id: movie.id,
          title: movie.title,
          posterUrl: movie.posterUrl,
          releaseDate: movie.releaseDate,
          reason: "",
        },
      ],
    }));
  };

  const removeMovie = (movieId: string) => {
    setForm((current) => ({
      ...current,
      movies: current.movies.filter((movie) => movie.id !== movieId),
    }));
  };

  const updateMovieReason = (movieId: string, reason: string) => {
    setForm((current) => ({
      ...current,
      movies: current.movies.map((movie) =>
        movie.id === movieId ? { ...movie, reason } : movie,
      ),
    }));
  };

  const editCuration = (curation: Curation) => {
    setEditingId(curation.id);
    setForm(toForm(curation));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = toPayload(form);

    if (editingId) {
      updateMutation.mutate({ id: editingId, input }, { onSuccess: resetForm });
    } else {
      createMutation.mutate(input, { onSuccess: resetForm });
    }
  };

  const confirmDelete = (curation: Curation) => {
    if (!window.confirm(`'${curation.title}' 큐레이션을 삭제할까요?`)) return;
    deleteMutation.mutate(curation.id);
  };

  return (
    <main className="mx-auto min-h-[calc(100vh-11rem)] max-w-7xl px-6 py-12 sm:py-16">
      <AdminNavigation />

      <AppModal
        open={calendarTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCalendarTarget(null);
        }}
        title={calendarTarget === "startsAt" ? "노출 시작일" : "노출 종료일"}
        description="큐레이션이 로비에 표시될 날짜를 선택하세요."
        className="w-[calc(100%-2rem)] sm:max-w-md"
      >
        <Calendar
          mode="single"
          required
          locale={ko}
          captionLayout="dropdown"
          startMonth={new Date(2020, 0, 1)}
          endMonth={new Date(2035, 11, 31)}
          month={calendarMonth}
          selected={
            calendarTarget && form[calendarTarget]
              ? parseDateValue(form[calendarTarget])
              : undefined
          }
          onMonthChange={setCalendarMonth}
          onSelect={(date) => {
            if (date) selectCalendarDate(date);
          }}
          className="mx-auto w-full"
        />
      </AppModal>

      <header className="mb-8">
        <p className="text-sm font-semibold tracking-[0.32em] text-cinemo-gold">ADMIN CURATION</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-cinemo-text sm:text-4xl">
              큐레이션 관리
            </h1>
            <p className="mt-3 text-sm text-cinemo-muted">
              노출 기간과 영화를 정하면 로비 Hero에서 자동으로 보여요.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-cinemo-muted transition hover:border-cinemo-gold/40 hover:text-cinemo-text"
            >
              <X className="size-4" />
              새 큐레이션
            </button>
          )}
        </div>
      </header>

      <form onSubmit={submitForm} className="rounded-3xl border border-white/10 bg-[#101f21] p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-cinemo-gold/10 text-cinemo-gold">
            {editingId ? <Pencil className="size-5" /> : <Plus className="size-5" />}
          </div>
          <div>
            <h2 className="font-semibold text-cinemo-text">
              {editingId ? "큐레이션 수정" : "새 큐레이션 만들기"}
            </h2>
            <p className="mt-1 text-xs text-cinemo-muted">영화는 검색해서 선택하면 됨</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="식별자(slug)">
            <input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="halloween-movies" className={inputClass} />
          </Field>
          <Field label="Hero 상단 문구 (선택)">
            <input value={form.eyebrow} onChange={(event) => setForm({ ...form, eyebrow: event.target.value })} placeholder="비워 두면 CINEMO CURATION으로 표시" className={inputClass} />
          </Field>
          <Field label="Hero 제목 (선택)">
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="여러 기념일이 겹치면 비워 둘 수 있음" className={inputClass} />
          </Field>
          <Field label="상태">
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="큐레이션 상태">
              {(Object.keys(statusLabels) as CurationStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  role="radio"
                  aria-checked={form.status === status}
                  onClick={() => setForm({ ...form, status })}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    form.status === status
                      ? "border-cinemo-gold/70 bg-cinemo-gold/12 text-cinemo-gold-light"
                      : "border-white/10 bg-[#0b191a] text-cinemo-muted hover:border-cinemo-gold/35"
                  }`}
                >
                  <span className="block text-xs font-semibold">{statusLabels[status]}</span>
                  <span className="mt-1 block text-[10px] opacity-70">{statusDescriptions[status]}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="노출 시작일">
            <button type="button" onClick={() => openCalendar("startsAt")} className={`${inputClass} flex items-center justify-between text-left`}>
              <span className={form.startsAt ? "text-cinemo-text" : "text-cinemo-muted"}>{formatKoreanDate(form.startsAt)}</span>
              <CalendarDays className="size-4 text-cinemo-gold" />
            </button>
          </Field>
          <Field label="노출 종료일">
            <button type="button" onClick={() => openCalendar("endsAt")} className={`${inputClass} flex items-center justify-between text-left`}>
              <span className={form.endsAt ? "text-cinemo-text" : "text-cinemo-muted"}>{formatKoreanDate(form.endsAt)}</span>
              <CalendarDays className="size-4 text-cinemo-gold" />
            </button>
          </Field>
          <Field label="설명" className="md:col-span-2">
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} placeholder="이 큐레이션을 고른 이유" className={`${inputClass} min-h-24 resize-y py-3`} />
          </Field>
        </div>

        <section className="mt-7 border-t border-white/8 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-semibold text-cinemo-text">큐레이션 영화</h3>
              <p className="mt-1 text-xs text-cinemo-muted">현재 {form.movies.length}편 선택됨</p>
            </div>
            <div className="flex w-full max-w-md gap-2">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">영화 검색</span>
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cinemo-muted" />
                <input value={movieQuery} onChange={(event) => setMovieQuery(event.target.value)} placeholder="영화 제목 검색" className={`${inputClass} pl-9`} />
              </label>
              <button type="button" onClick={handleMovieSearch} className="rounded-xl bg-cinemo-gold px-4 text-sm font-semibold text-cinemo-dark">검색</button>
            </div>
          </div>

          {moviesSearchQuery.data && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {moviesSearchQuery.data.items.map((movie) => (
                <button key={movie.id} type="button" disabled={selectedIds.has(movie.id)} onClick={() => addMovie(movie)} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3 text-left transition hover:border-cinemo-gold/40 disabled:cursor-default disabled:opacity-45">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-white/5">
                    {movie.posterUrl && <img src={movie.posterUrl} alt="" className="size-full object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-cinemo-text">{movie.title}</span>
                    <span className="mt-1 block text-xs text-cinemo-muted">
                      {movie.releaseDate ?? "개봉일 미정"} · {movie.visibility === "PUBLIC" ? "공개" : movie.visibility === "REVIEW" ? "검토" : "숨김"}
                    </span>
                  </span>
                  {selectedIds.has(movie.id) ? <Check className="size-4 text-cinemo-gold" /> : <Plus className="size-4 text-cinemo-muted" />}
                </button>
              ))}
            </div>
          )}

          <div className="mt-5 space-y-3">
            {form.movies.map((movie, index) => (
              <div key={movie.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-cinemo-gold/15 bg-cinemo-gold/[0.04] p-3">
                <span className="w-5 text-center text-sm font-semibold text-cinemo-gold">{index + 1}</span>
                <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-white/5">
                  {movie.posterUrl && <img src={movie.posterUrl} alt="" className="size-full object-cover" />}
                </span>
                <span className="min-w-32 flex-1 truncate text-sm font-medium text-cinemo-text">
                  <span className="block truncate">{movie.title}</span>
                  <span className="mt-1 block text-xs font-normal text-cinemo-muted">
                    {movie.releaseDate ?? "개봉일 미정"}
                  </span>
                </span>
                <input value={movie.reason} onChange={(event) => updateMovieReason(movie.id, event.target.value)} placeholder="선택 이유(선택)" className={`${inputClass} w-full sm:w-56`} />
                <button type="button" onClick={() => removeMovie(movie.id)} className="rounded-lg p-2 text-cinemo-muted transition hover:bg-red-400/10 hover:text-red-300" aria-label={`${movie.title} 제거`}><Trash2 className="size-4" /></button>
              </div>
            ))}
            {form.movies.length === 0 && <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-cinemo-muted">위에서 영화를 검색해 추가하세요.</p>}
          </div>
        </section>

        <div className="mt-7 flex justify-end gap-3 border-t border-white/8 pt-6">
          {editingId && <button type="button" onClick={resetForm} className="rounded-xl border border-white/10 px-5 py-3 text-sm text-cinemo-muted">취소</button>}
          <button type="submit" disabled={isSaving || form.movies.length === 0} className="rounded-xl bg-cinemo-gold px-5 py-3 text-sm font-semibold text-cinemo-dark transition hover:bg-cinemo-gold-light disabled:cursor-not-allowed disabled:opacity-45">
            {isSaving ? "저장 중..." : editingId ? "큐레이션 수정" : "큐레이션 저장"}
          </button>
        </div>
      </form>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-cinemo-text">등록된 큐레이션</h2>
          <button type="button" onClick={() => void curationsQuery.refetch()} className="text-sm text-cinemo-gold-light">새로고침</button>
        </div>
        {curationsQuery.isPending && <p className="text-sm text-cinemo-muted">큐레이션을 불러오는 중...</p>}
        {curationsQuery.isError && <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">큐레이션을 불러오지 못했습니다.</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          {curationsQuery.data?.map((curation) => (
            <CurationCard key={curation.id} curation={curation} onEdit={editCuration} onDelete={confirmDelete} />
          ))}
        </div>
        {curationsQuery.data?.length === 0 && <p className="rounded-2xl border border-white/10 bg-[#101f21] px-5 py-8 text-center text-sm text-cinemo-muted">등록된 큐레이션이 없습니다.</p>}
      </section>
    </main>
  );
}

const inputClass = "h-11 w-full rounded-xl border border-white/10 bg-[#0b191a] px-3 text-sm text-cinemo-text outline-none transition placeholder:text-cinemo-muted focus:border-cinemo-gold/60";

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={className}><span className="mb-2 block text-xs font-medium text-cinemo-muted">{label}</span>{children}</label>;
}

function CurationCard({ curation, onEdit, onDelete }: { curation: Curation; onEdit: (curation: Curation) => void; onDelete: (curation: Curation) => void }) {
  return <article className="rounded-2xl border border-white/10 bg-[#101f21] p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-xs tracking-[0.2em] text-cinemo-gold">{curation.eyebrow || "CINEMO CURATION"}</p><h3 className="mt-2 truncate text-lg font-semibold text-cinemo-text">{curation.title || "제목 없는 큐레이션"}</h3><p className="mt-1 text-xs text-cinemo-muted">{curation.slug}</p></div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${curation.status === "PUBLISHED" ? "bg-emerald-400/10 text-emerald-300" : "bg-white/8 text-cinemo-muted"}`}>{statusLabels[curation.status]}</span>
    </div>
    <div className="mt-4 flex items-center gap-2 text-xs text-cinemo-muted"><CalendarDays className="size-4" />{toInputDate(curation.startsAt) || "시작일 없음"} ~ {toInputDate(curation.endsAt) || "종료일 없음"}</div>
    <div className="mt-4 flex -space-x-2">{curation.movies.slice(0, 8).map((movie) => movie.posterUrl ? <img key={movie.id} src={movie.posterUrl} alt="" className="size-12 rounded-lg border-2 border-[#101f21] object-cover" /> : <span key={movie.id} className="size-12 rounded-lg border-2 border-[#101f21] bg-white/10" />)}</div>
    <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => onEdit(curation)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-cinemo-muted hover:border-cinemo-gold/40 hover:text-cinemo-gold-light"><Pencil className="size-3.5" />수정</button><button type="button" onClick={() => onDelete(curation)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300 hover:bg-red-400/10"><Trash2 className="size-3.5" />삭제</button></div>
  </article>;
}
