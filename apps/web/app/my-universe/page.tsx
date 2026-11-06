"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Minus, Plus, RotateCcw, Volume2, VolumeX, X } from "lucide-react";

import type { MyMovie } from "@/lib/api/movies";
import { authMeQueryOptions } from "@/lib/queries/auth.query";
import { myMoviesQueryOptions } from "@/lib/queries/my-movies.query";

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1000;
const LAYOUT_STORAGE_KEY = "cinemo:my-universe:graph-layout:v1";
const MIN_SCALE = 0.35;
const MAX_SCALE = 2.4;

type Point = { x: number; y: number };
type Layout = Record<string, Point>;

type GraphEdge = {
  from: MyMovie;
  to: MyMovie;
  sharedDirectors: string[];
  sharedActors: string[];
  sharedGenres: string[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function randomFromHash(hash: number, offset: number) {
  const value = Math.sin(hash * 0.000001 + offset * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function readStoredLayout(): Layout {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Layout;
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, point]) =>
          point &&
          Number.isFinite(point.x) &&
          Number.isFinite(point.y) &&
          point.x >= 0 &&
          point.x <= WORLD_WIDTH &&
          point.y >= 0 &&
          point.y <= WORLD_HEIGHT,
      ),
    );
  } catch {
    return {};
  }
}

function createStableLayout(movies: MyMovie[], previous: Layout): Layout {
  const next: Layout = {};
  const occupied: Point[] = [];

  for (const movie of movies) {
    const saved = previous[movie.movieId];
    if (saved) {
      next[movie.movieId] = saved;
      occupied.push(saved);
    }
  }

  for (const movie of movies) {
    if (next[movie.movieId]) continue;

    const hash = hashString(movie.movieId);
    const seedX = 140 + randomFromHash(hash, 1) * (WORLD_WIDTH - 280);
    const seedY = 130 + randomFromHash(hash, 2) * (WORLD_HEIGHT - 260);
    let candidate = { x: seedX, y: seedY };

    for (let attempt = 0; attempt < 48; attempt += 1) {
      const angle = randomFromHash(hash, attempt + 3) * Math.PI * 2;
      const radius = 90 + attempt * 22;
      const nextCandidate = {
        x: clamp(seedX + Math.cos(angle) * radius, 120, WORLD_WIDTH - 120),
        y: clamp(seedY + Math.sin(angle) * radius, 110, WORLD_HEIGHT - 110),
      };

      if (occupied.every((point) => distance(point, nextCandidate) > 95)) {
        candidate = nextCandidate;
        break;
      }
    }

    next[movie.movieId] = candidate;
    occupied.push(candidate);
  }

  return next;
}

function getGenres(movie: MyMovie) {
  return Array.from(
    new Set(
      movie.genres
        .map((genre) => genre.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function LoginRequiredModal() {
  const router = useRouter();

  return (
    <div
      aria-labelledby="login-required-title"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#02050d]/85 px-4 py-8 backdrop-blur-sm"
      role="dialog"
    >
      <section className="w-full max-w-md rounded-[28px] border border-[#d9b866]/35 bg-[#09162b] p-6 text-[#f7f1e7] shadow-2xl shadow-black/40 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.28em] text-[#d9b866]">
          MY UNIVERSE
        </p>
        <h1 id="login-required-title" className="mt-3 text-2xl font-bold">
          로그인 해주세요
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          내 우주는 관람 기록으로 만들어집니다.
        </p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-white/40 hover:text-white"
            type="button"
            onClick={() => router.push("/lobby")}
          >
            취소
          </button>
          <button
            className="rounded-full bg-[#d9b866] px-5 py-3 text-sm font-bold text-[#07101e] transition hover:bg-[#ecd081]"
            type="button"
            onClick={() => router.push("/login")}
          >
            로그인 하러가기
          </button>
        </div>
      </section>
    </div>
  );
}

export default function MyUniversePage() {
  const authQuery = useQuery(authMeQueryOptions());

  if (authQuery.isPending) {
    return (
      <main
        aria-busy="true"
        className="min-h-[calc(100dvh-11rem)] bg-[#02050d]"
      />
    );
  }

  if (!authQuery.data) {
    return <LoginRequiredModal />;
  }

  return <UniverseCanvas />;
}

function segmentsCross(a: Point, b: Point, c: Point, d: Point) {
  const orientation = (p: Point, q: Point, r: Point) =>
    (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);

  const first = orientation(a, b, c);
  const second = orientation(a, b, d);
  const third = orientation(c, d, a);
  const fourth = orientation(c, d, b);

  return first * second < 0 && third * fourth < 0;
}

// 별자리 전체의 크기는 제한하지 않는다. 한 별에서만 가까운 관계를
// 네 갈래까지 유지해 한 지점에 선이 과하게 얽히는 것을 막는다.
const MAX_CONSTELLATION_BRANCHES = 4;
const MAX_CONSTELLATION_LINK_DISTANCE = 560;

function createsConstellationCycle(edges: GraphEdge[], fromId: string, toId: string) {
  const neighbors = new Map<string, string[]>();
  const connect = (source: string, target: string) => {
    const current = neighbors.get(source) ?? [];
    current.push(target);
    neighbors.set(source, current);
  };

  for (const edge of edges) {
    connect(edge.from.movieId, edge.to.movieId);
    connect(edge.to.movieId, edge.from.movieId);
  }

  const visited = new Set<string>();
  const pending = [fromId];

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    if (current === toId) return true;

    visited.add(current);
    pending.push(...(neighbors.get(current) ?? []));
  }

  return false;
}

function getSharedPeople(
  first: MyMovie,
  second: MyMovie,
  relation: "directors" | "actors",
) {
  const secondPeople = new Set(
    (second[relation] ?? []).map((person) => person.id),
  );

  return (first[relation] ?? [])
    .filter((person) => secondPeople.has(person.id))
    .map((person) => person.name);
}

function buildRelatedEdges(movies: MyMovie[], layout: Layout): GraphEdge[] {
  const candidates: Array<GraphEdge & { score: number }> = [];

  for (let firstIndex = 0; firstIndex < movies.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < movies.length;
      secondIndex += 1
    ) {
      const first = movies[firstIndex];
      const second = movies[secondIndex];
      const secondGenres = new Set(getGenres(second));
      const sharedGenres = getGenres(first).filter((genre) =>
        secondGenres.has(genre),
      );
      const sharedDirectors = getSharedPeople(first, second, "directors");
      const sharedActors = getSharedPeople(first, second, "actors");
      const firstPoint = layout[first.movieId];
      const secondPoint = layout[second.movieId];

      const hasStrongRelation =
        sharedDirectors.length > 0 ||
        sharedActors.length > 0 ||
        sharedGenres.length >= 2;

      if (!hasStrongRelation || !firstPoint || !secondPoint) {
        continue;
      }

      const linkDistance = distance(firstPoint, secondPoint);
      if (linkDistance > MAX_CONSTELLATION_LINK_DISTANCE) {
        continue;
      }

      candidates.push({
        from: first,
        to: second,
        sharedDirectors,
        sharedActors,
        sharedGenres,
        score:
          sharedDirectors.length * 2_400 +
          sharedActors.length * 750 +
          sharedGenres.length * 260 -
          linkDistance * 1.15,
      });
    }
  }

  candidates.sort((first, second) => second.score - first.score);

  const degree = new Map<string, number>();
  const edges: GraphEdge[] = [];

  for (const candidate of candidates) {
    const fromDegree = degree.get(candidate.from.movieId) ?? 0;
    const toDegree = degree.get(candidate.to.movieId) ?? 0;
    if (
      fromDegree >= MAX_CONSTELLATION_BRANCHES ||
      toDegree >= MAX_CONSTELLATION_BRANCHES
    ) {
      continue;
    }
    if (
      createsConstellationCycle(
        edges,
        candidate.from.movieId,
        candidate.to.movieId,
      )
    ) {
      continue;
    }

    const crossesExisting = edges.some((edge) => {
      const edgeFrom = layout[edge.from.movieId];
      const edgeTo = layout[edge.to.movieId];
      const candidateFrom = layout[candidate.from.movieId];
      const candidateTo = layout[candidate.to.movieId];

      if (!edgeFrom || !edgeTo || !candidateFrom || !candidateTo) return false;
      if (
        edge.from.movieId === candidate.from.movieId ||
        edge.from.movieId === candidate.to.movieId ||
        edge.to.movieId === candidate.from.movieId ||
        edge.to.movieId === candidate.to.movieId
      ) {
        return false;
      }

      return segmentsCross(edgeFrom, edgeTo, candidateFrom, candidateTo);
    });

    if (crossesExisting) continue;

    edges.push(candidate);
    degree.set(candidate.from.movieId, fromDegree + 1);
    degree.set(candidate.to.movieId, toDegree + 1);
  }

  return edges;
}

function MovieModal({
  movie,
  onClose,
}: {
  movie: MyMovie;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#02050d]/80 px-3 py-5 backdrop-blur-sm sm:px-6 sm:py-10"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="relative mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-4xl items-center"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex max-h-[calc(100dvh-2.5rem)] w-full flex-row items-center gap-4 overflow-y-auto rounded-[28px] border border-[#d9b866]/35 bg-[#09162b] p-4 pr-14 text-[#f7f1e7] shadow-2xl shadow-black/50 sm:gap-6 sm:p-6 sm:pr-16 md:gap-8 md:p-8 md:pr-20">
          <button
            aria-label="영화 모달 닫기"
            className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#07101e] text-[#f7f1e7] shadow-lg transition hover:border-[#d9b866]/70 hover:text-[#d9b866] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9b866] sm:right-4 sm:top-4"
            type="button"
            onClick={onClose}
          >
            <X size={22} />
          </button>

          <div className="aspect-[2/3] w-[38%] max-w-[240px] shrink-0 overflow-hidden rounded-2xl bg-[#101d34]">
            {movie.posterUrl ? (
              <img
                alt={movie.title + " 포스터"}
                className="h-full w-full object-contain"
                src={movie.posterUrl}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-3 text-center text-xs text-white/50 sm:p-5 sm:text-sm">
                포스터 없음
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <p className="mb-2 text-[10px] font-semibold tracking-[0.2em] text-[#d9b866] sm:mb-3 sm:text-xs sm:tracking-[0.28em]">
              OBSERVED STAR
            </p>
            <h2 className="text-xl font-semibold tracking-tight sm:text-3xl">
              {movie.title}
            </h2>
            <p className="mt-2 text-xs text-white/55 sm:mt-3 sm:text-sm">
              {movie.releaseDate?.slice(0, 10) ?? "개봉일 정보 없음"}
              {movie.genres.length ? " · " + movie.genres.join(" · ") : ""}
            </p>
            <button
              className="mt-5 inline-flex w-fit items-center rounded-full bg-[#d9b866] px-4 py-2.5 text-xs font-semibold text-[#07101e] transition hover:bg-[#eed28a] sm:mt-7 sm:px-5 sm:py-3 sm:text-sm"
              type="button"
              onClick={() => {
                onClose();
                router.push("/movies/" + movie.movieId);
              }}
            >
              영화 상세 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UniverseCanvas() {
  const moviesQuery = useQuery(myMoviesQueryOptions());
  const viewportRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [layout, setLayout] = useState<Layout>({});
  const [view, setView] = useState({ x: 0, y: 0, scale: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<MyMovie | null>(null);

  const watchedMovies = useMemo(
    () =>
      (moviesQuery.data ?? [])
        .filter((movie) => movie.isWatched)
        .sort((first, second) => first.movieId.localeCompare(second.movieId)),
    [moviesQuery.data],
  );
  const movieKey = watchedMovies.map((movie) => movie.movieId).join("|");

  useEffect(() => {
    const stored = readStoredLayout();
    const next = createStableLayout(watchedMovies, stored);
    setLayout(next);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next));
    }
  }, [movieKey, watchedMovies]);

  const edges = useMemo(
    () => buildRelatedEdges(watchedMovies, layout),
    [layout, watchedMovies],
  );

  const fitView = useCallback(() => {
    const viewport = viewportRef.current;
    const points = watchedMovies
      .map((movie) => layout[movie.movieId])
      .filter((point): point is Point => Boolean(point));

    if (!viewport || !points.length) {
      setView({ x: 0, y: 0, scale: 0.8 });
      return;
    }

    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const contentWidth = Math.max(560, maxX - minX + 260);
    const contentHeight = Math.max(420, maxY - minY + 220);
    const scale = clamp(
      Math.min(
        (viewport.clientWidth - 60) / contentWidth,
        (viewport.clientHeight - 110) / contentHeight,
      ),
      MIN_SCALE,
      1.15,
    );
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setView({
      x: viewport.clientWidth / 2 - centerX * scale,
      y: viewport.clientHeight / 2 - centerY * scale,
      scale,
    });
  }, [layout, watchedMovies]);

  useEffect(() => {
    if (!viewportRef.current) return;

    const observer = new ResizeObserver(() => fitView());
    observer.observe(viewportRef.current);
    fitView();

    return () => observer.disconnect();
  }, [fitView]);

  // 화면을 새로 열거나 관람 기록이 달라지면 전체 별자리가 다시 보이게 맞춘다.
  useEffect(() => {
    if (!watchedMovies.length || !Object.keys(layout).length) return;

    const frame = window.requestAnimationFrame(fitView);
    return () => window.cancelAnimationFrame(frame);
  }, [fitView, layout, watchedMovies.length]);

  const zoomBy = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const rect = viewport.getBoundingClientRect();
      setView((current) => {
        const scale = clamp(current.scale * factor, MIN_SCALE, MAX_SCALE);
        const anchorX =
          clientX === undefined ? rect.width / 2 : clientX - rect.left;
        const anchorY =
          clientY === undefined ? rect.height / 2 : clientY - rect.top;
        const worldX = (anchorX - current.x) / current.scale;
        const worldY = (anchorY - current.y) / current.scale;

        return {
          scale,
          x: anchorX - worldX * scale,
          y: anchorY - worldY * scale,
        };
      });
    },
    [],
  );

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.1 : 0.9;
    zoomBy(factor, event.clientX, event.clientY);
  };

  const toggleAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsAudioPlaying(false);
      }
      return;
    }

    audio.pause();
    audio.currentTime = 0;
  }, []);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof Element && target.closest("[data-universe-node]")) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: view.x,
      originY: view.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    setView((current) => ({
      ...current,
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    }));
  };

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setIsDragging(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#02050d] text-[#f7f1e7]">
      <audio
        ref={audioRef}
        loop
        preload="metadata"
        src="/audio/space-ambient.mp3"
        onPause={() => setIsAudioPlaying(false)}
        onPlay={() => setIsAudioPlaying(true)}
      />
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-[#02050d]/90 px-6 py-5 backdrop-blur-md sm:px-10">
        <p className="text-[10px] font-semibold tracking-[0.38em] text-[#d9b866]">
          MY UNIVERSE
        </p>
        <p className="text-xs text-white/45">{watchedMovies.length}편 관람</p>
      </header>

      <section
        ref={viewportRef}
        aria-label="관람 영화 그래프"
        className={
          "relative h-[calc(100vh-72px)] min-h-[560px] overflow-hidden bg-[radial-gradient(circle_at_50%_40%,rgba(31,58,98,0.3),transparent_45%),linear-gradient(135deg,#030714_0%,#071526_55%,#02050d_100%)] " +
          (isDragging ? "cursor-grabbing" : "cursor-grab")
        }
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onWheel={handleWheel}
      >
        {moviesQuery.isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/45">
            내 우주를 펼치는 중…
          </div>
        ) : moviesQuery.isError || watchedMovies.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <div>
              <p className="text-lg font-medium">관람 기록이 아직 없습니다.</p>
            </div>
          </div>
        ) : (
          <div
            className="absolute left-0 top-0 will-change-transform"
            style={{
              height: WORLD_HEIGHT,
              width: WORLD_WIDTH,
              transform:
                "translate3d(" +
                view.x +
                "px, " +
                view.y +
                "px, 0) scale(" +
                view.scale +
                ")",
              transformOrigin: "0 0",
            }}
          >
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              height={WORLD_HEIGHT}
              viewBox={"0 0 " + WORLD_WIDTH + " " + WORLD_HEIGHT}
              width={WORLD_WIDTH}
            >
              {edges.map((edge) => {
                const from = layout[edge.from.movieId];
                const to = layout[edge.to.movieId];
                if (!from || !to) return null;

                return (
                  <line
                    key={edge.from.movieId + "-" + edge.to.movieId}
                    opacity={0.48}
                    stroke="#a8b9d0"
                    strokeLinecap="round"
                    strokeWidth="1.25"
                    x1={from.x}
                    x2={to.x}
                    y1={from.y}
                    y2={to.y}
                  />
                );
              })}
            </svg>

            {watchedMovies.map((movie, index) => {
              const point = layout[movie.movieId];
              if (!point) return null;

              // 캔버스가 축소되어도 별을 누르는 영역은 손가락으로 누를 수 있는 크기를 유지함.
              const starTapSize = 52 / view.scale;

              return (
                <button
                  key={movie.movieId}
                  aria-label={movie.title + " 영화 모달 열기"}
                  className="group absolute z-10 cursor-pointer text-left outline-none"
                  data-universe-node
                  style={{
                    left: point.x,
                    top: point.y,
                    width: starTapSize,
                    height: starTapSize,
                    transform: "translate(-50%, -50%)",
                  }}
                  type="button"
                  onPointerDown={(event) => {
                    // 별을 누른 동작은 캔버스 드래그로 넘기지 않음.
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedMovie(movie);
                  }}
                >
                  <span
                    className="pointer-events-none absolute left-1/2 top-1/2 block h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#fff8dc] bg-[#e7ca7a] shadow-[0_0_0_3px_rgba(231,202,122,0.08),0_0_22px_7px_rgba(231,202,122,0.55)] transition duration-200 group-hover:scale-150 group-focus-visible:scale-150"
                    style={{
                      backgroundColor: index % 5 === 0 ? "#fff8dc" : "#e7ca7a",
                    }}
                  />
                  <span className="pointer-events-none absolute left-1/2 top-1/2 mt-4 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#02050d]/75 px-2.5 py-1 text-[13px] font-medium text-white/80 opacity-75 backdrop-blur-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    {movie.title}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div
          className="absolute bottom-5 left-5 right-5 flex items-end justify-end gap-4 sm:bottom-7 sm:left-8 sm:right-8"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#050b18]/75 p-2 backdrop-blur-md">
            <button
              aria-label="축소"
              className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              type="button"
              onClick={() => zoomBy(0.85)}
            >
              <Minus size={18} />
            </button>
            <span className="min-w-12 text-center text-xs tabular-nums text-white/50">
              {Math.round(view.scale * 100)}%
            </span>
            <button
              aria-label="확대"
              className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              type="button"
              onClick={() => zoomBy(1.18)}
            >
              <Plus size={18} />
            </button>
            <button
              aria-label="전체 그래프 보기"
              className="ml-1 rounded-xl p-2 text-[#d9b866] transition hover:bg-white/10"
              type="button"
              onClick={fitView}
            >
              <RotateCcw size={17} />
            </button>
            <span aria-hidden="true" className="h-5 w-px bg-white/10" />
            <button
              aria-label={isAudioPlaying ? "우주 사운드 끄기" : "우주 사운드 켜기"}
              className="rounded-xl p-2 text-[#d9b866] transition hover:bg-white/10"
              type="button"
              onClick={toggleAudio}
            >
              {isAudioPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>
      </section>

      {selectedMovie ? (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      ) : null}
    </main>
  );
}
