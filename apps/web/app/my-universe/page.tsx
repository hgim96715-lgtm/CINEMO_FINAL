"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import type { MyMovie } from "@/lib/api/movies";
import { myMoviesQueryOptions } from "@/lib/queries/my-movies.query";

type Constellation = {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  label: string;
  points: Array<[number, number, number]>;
  lines: Array<[number, number]>;
  movieIds: string[];
  posterUrl?: string | null;
};

type TagConstellation = Constellation & {
  tag: string;
  left: string;
  top: string;
};

type MovieStar = {
  movie: MyMovie;
  left: string;
  top: string;
  size: string;
  accent: string;
};

type MovieLink = {
  from: MovieStar;
  to: MovieStar;
  accent: string;
};

const tagStyles = [
  { color: "#d9c083", shape: "heart" },
  { color: "#9fc8ef", shape: "orbit" },
  { color: "#efb7c8", shape: "burst" },
  { color: "#b8d8b0", shape: "crown" },
] as const;

const shapePoints = {
  heart: [
    [70, 24, 2],
    [54, 12, 1.4],
    [39, 17, 1.5],
    [29, 31, 1.2],
    [38, 49, 1.4],
    [52, 67, 1.8],
    [70, 86, 1.5],
    [88, 67, 1.8],
    [102, 49, 1.3],
    [111, 31, 1.2],
    [101, 17, 1.5],
    [86, 12, 1.4],
  ] as Array<[number, number, number]>,
  orbit: [
    [70, 12, 1.4],
    [92, 20, 1.6],
    [108, 39, 1.2],
    [104, 62, 1.7],
    [88, 80, 1.3],
    [65, 87, 1.6],
    [43, 78, 1.2],
    [29, 57, 1.5],
    [33, 34, 1.2],
    [51, 19, 1.6],
  ] as Array<[number, number, number]>,
  burst: [
    [70, 10, 2],
    [83, 29, 1.3],
    [108, 30, 1.6],
    [90, 47, 1.2],
    [102, 70, 1.5],
    [70, 58, 2],
    [39, 70, 1.4],
    [50, 47, 1.2],
    [32, 30, 1.5],
    [57, 29, 1.3],
  ] as Array<[number, number, number]>,
  crown: [
    [30, 70, 1.4],
    [38, 32, 1.7],
    [56, 55, 1.2],
    [70, 22, 2],
    [84, 55, 1.2],
    [102, 32, 1.7],
    [110, 70, 1.4],
    [70, 82, 1.5],
  ] as Array<[number, number, number]>,
};

const shapeLines = {
  heart: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 0],
  ] as Array<[number, number]>,
  orbit: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 0],
    [1, 6],
    [3, 8],
  ] as Array<[number, number]>,
  burst: [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [0, 6],
    [0, 7],
    [0, 8],
    [0, 9],
  ] as Array<[number, number]>,
  crown: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 0],
    [1, 4],
  ] as Array<[number, number]>,
};

function normalizeTag(tag: string) {
  return tag.trim().replace(/\s+/g, " ");
}

function linksCross(left: MovieLink, right: MovieLink) {
  const leftFrom = {
    x: Number.parseFloat(left.from.left),
    y: Number.parseFloat(left.from.top),
  };
  const leftTo = {
    x: Number.parseFloat(left.to.left),
    y: Number.parseFloat(left.to.top),
  };
  const rightFrom = {
    x: Number.parseFloat(right.from.left),
    y: Number.parseFloat(right.from.top),
  };
  const rightTo = {
    x: Number.parseFloat(right.to.left),
    y: Number.parseFloat(right.to.top),
  };
  const cross = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number },
  ) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

  const leftSideA = cross(leftFrom, leftTo, rightFrom);
  const leftSideB = cross(leftFrom, leftTo, rightTo);
  const rightSideA = cross(rightFrom, rightTo, leftFrom);
  const rightSideB = cross(rightFrom, rightTo, leftTo);

  return leftSideA * leftSideB < 0 && rightSideA * rightSideB < 0;
}

function makeMovieConstellation(movie: MyMovie): Constellation {
  const genres = movie.genres?.filter(Boolean) ?? [];
  const accent = tagStyles[genres.length % tagStyles.length].color;
  return {
    id: `movie:${movie.movieId}`,
    title: movie.title || "이름 없는 영화",
    subtitle: genres.length > 0 ? genres.join(" · ") : "아직 이름 붙지 않은 별",
    accent,
    label: `${movie.title || "영화"} 별`,
    points: [[70, 115, 3.2]],
    lines: [],
    movieIds: [movie.movieId],
    posterUrl: movie.posterUrl,
  };
}

function getScatteredPosition(index: number, total: number) {
  const angle = index * 2.399963;
  const radius = total <= 1 ? 0 : 14 + ((index * 31) % 100) * 0.54;
  return {
    left: `${Math.max(4, Math.min(96, 50 + Math.cos(angle) * radius))}%`,
    top: `${Math.max(8, Math.min(92, 46 + Math.sin(angle) * radius * 0.72))}%`,
  };
}

function buildTagConstellations(movies: MyMovie[]): TagConstellation[] {
  const grouped = new Map<string, MyMovie[]>();
  for (const movie of movies) {
    for (const rawTag of movie.genres ?? []) {
      const tag = normalizeTag(rawTag);
      if (!tag) continue;
      grouped.set(tag, [...(grouped.get(tag) ?? []), movie]);
    }
  }

  return Array.from(grouped.entries())
    .filter(([, groupedMovies]) => groupedMovies.length >= 3)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 4)
    .map(([tag, groupedMovies], index) => {
      const style = tagStyles[index % tagStyles.length];
      const points = shapePoints[style.shape].slice(
        0,
        Math.max(
          3,
          Math.min(groupedMovies.length, shapePoints[style.shape].length),
        ),
      );
      return {
        id: `tag:${tag}`,
        tag,
        title: `${tag}의 궤도`,
        subtitle: `${groupedMovies.length}편의 영화가 만든 별자리`,
        accent: style.color,
        label: `${tag} 별자리`,
        points,
        lines: shapeLines[style.shape].filter(
          ([from, to]) => from < points.length && to < points.length,
        ),
        movieIds: groupedMovies.map((movie) => movie.movieId),
        left: `${22 + (index % 2) * 56}%`,
        top: `${25 + Math.floor(index / 2) * 28}%`,
      };
    });
}

/**
 * 영화 별의 실제 화면 좌표를 사용해 같은 장르의 별을 연결함.
 * 장르별 추상 도형을 따로 그리지 않고, 화면에 보이는 영화 별 자체가
 * 별자리의 점이 되도록 하는 것이 핵심임.
 */
function buildMovieLinks(movies: MyMovie[], stars: MovieStar[]): MovieLink[] {
  const starsByMovieId = new Map(
    stars.map((star) => [star.movie.movieId, star]),
  );
  const grouped = new Map<string, MyMovie[]>();

  for (const movie of movies) {
    for (const rawGenre of movie.genres ?? []) {
      const genre = normalizeTag(rawGenre);
      if (!genre) continue;
      grouped.set(genre, [...(grouped.get(genre) ?? []), movie]);
    }
  }

  const candidates: Array<MovieLink & { distance: number; genreIndex: number }> = [];
  const maxLinkDistance = 20;

  Array.from(grouped.entries()).forEach(([, genreMovies], genreIndex) => {
    if (genreMovies.length < 3) return;

    const accent = tagStyles[genreIndex % tagStyles.length].color;
    for (let fromIndex = 0; fromIndex < genreMovies.length; fromIndex += 1) {
      for (let toIndex = fromIndex + 1; toIndex < genreMovies.length; toIndex += 1) {
        const from = starsByMovieId.get(genreMovies[fromIndex].movieId);
        const to = starsByMovieId.get(genreMovies[toIndex].movieId);
        if (!from || !to) continue;

        const fromLeft = Number.parseFloat(from.left);
        const fromTop = Number.parseFloat(from.top);
        const toLeft = Number.parseFloat(to.left);
        const toTop = Number.parseFloat(to.top);
        const distance = Math.hypot(fromLeft - toLeft, fromTop - toTop);
        if (distance <= maxLinkDistance) {
          candidates.push({ from, to, accent, distance, genreIndex });
        }
      }
    }
  });

  // 가장 가까운 같은 장르끼리만 연결하고, 한 별에서 뻗는 선을 최대 2개로 제한함.
  // 이웃하지 않은 영화를 순서대로 잇는 방식보다 긴 대각선과 선 겹침이 줄어듦.
  candidates.sort(
    (left, right) => left.distance - right.distance || left.genreIndex - right.genreIndex,
  );
  const degree = new Map<string, number>();
  const links = new Map<string, MovieLink>();

  for (const candidate of candidates) {
    const fromId = candidate.from.movie.movieId;
    const toId = candidate.to.movie.movieId;
    if ((degree.get(fromId) ?? 0) >= 2 || (degree.get(toId) ?? 0) >= 2) continue;

    const key = [fromId, toId].sort().join(":");
    if (links.has(key)) continue;

    const link = {
      from: candidate.from,
      to: candidate.to,
      accent: candidate.accent,
    } satisfies MovieLink;
    if (Array.from(links.values()).some((existing) => linksCross(existing, link))) {
      continue;
    }

    links.set(key, link);
    degree.set(fromId, (degree.get(fromId) ?? 0) + 1);
    degree.set(toId, (degree.get(toId) ?? 0) + 1);
  }

  return Array.from(links.values());
}

export default function MyUniversePage() {
  const router = useRouter();
  const moviesQuery = useQuery(myMoviesQueryOptions());
  const movies = useMemo(
    () => (moviesQuery.data ?? []).filter((movie) => movie.isWatched),
    [moviesQuery.data],
  );
  const tagConstellations = useMemo(
    () => buildTagConstellations(movies),
    [movies],
  );
  const movieConstellations = useMemo(
    () => movies.map(makeMovieConstellation),
    [movies],
  );
  const movieConstellationById = useMemo(
    () => new Map(movieConstellations.map((item) => [item.movieIds[0], item])),
    [movieConstellations],
  );
  const targets = useMemo(
    () => [...tagConstellations, ...movieConstellations],
    [tagConstellations, movieConstellations],
  );
  const stars = useMemo<MovieStar[]>(
    () =>
      movies.map((movie, index) => ({
        movie,
        ...getScatteredPosition(index, movies.length),
        size: movie.isFavorite ? "size-3" : "size-2",
        accent:
          tagConstellations.find((tag) => tag.movieIds.includes(movie.movieId))
            ?.accent ?? "#fff9df",
      })),
    [movies, tagConstellations],
  );
  const movieLinks = useMemo(
    () => buildMovieLinks(movies, stars),
    [movies, stars],
  );
  const [selected, setSelected] = useState<Constellation | null>(null);
  const [isMicroscopeOpen, setIsMicroscopeOpen] = useState(false);
  const [isSpaceSoundMuted, setIsSpaceSoundMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const universeViewportRef = useRef<HTMLDivElement>(null);
  const universeScale = Math.max(
    1,
    Math.ceil(Math.sqrt(Math.max(movies.length, 1) / 12)),
  );
  const universeWidth = 1800 * universeScale;
  const universeHeight = 1500 * universeScale;

  const toggleSpaceSound = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isSpaceSoundMuted) {
      try {
        audio.muted = false;
        await audio.play();
        setIsSpaceSoundMuted(false);
      } catch {
        audio.muted = true;
        setIsSpaceSoundMuted(true);
      }
      return;
    }
    audio.muted = true;
    audio.pause();
    setIsSpaceSoundMuted(true);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 페이지에 다시 진입할 때 이전 audio 요소가 남아 있지 않도록
    // 초기 상태부터 재생을 중지하고 음소거함.
    audio.muted = true;
    audio.pause();
    audio.currentTime = 0;
    const handleEnded = () => setIsSpaceSoundMuted(true);
    audio.addEventListener("ended", handleEnded);
    return () => {
      // 상세 페이지로 이동하거나 브라우저 뒤로가기를 할 때
      // 기존 오디오가 계속 살아 있으면 재진입 시 소리가 겹침.
      audio.pause();
      audio.muted = true;
      audio.currentTime = 0;
      audio.removeAttribute("src");
      audio.load();
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    const viewport = universeViewportRef.current;
    if (!viewport) return;

    const center = () => {
      viewport.scrollLeft = Math.max(
        0,
        (viewport.scrollWidth - viewport.clientWidth) / 2,
      );
      viewport.scrollTop = Math.max(
        0,
        (viewport.scrollHeight - viewport.clientHeight) / 2,
      );
    };

    const frame = requestAnimationFrame(center);
    window.addEventListener("resize", center);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", center);
    };
  }, [universeHeight, universeWidth]);

  const inspect = (constellation: Constellation) => {
    setSelected(constellation);
    setIsMicroscopeOpen(true);
  };

  const openMovieDetail = (movieId: string) => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
        audio.muted = true;
        audio.currentTime = 0;
      } catch {
        // 오디오가 이미 해제된 경우
      }
    }
    setIsSpaceSoundMuted(true);
    setIsMicroscopeOpen(false);
    setSelected(null);
    router.push(`/movies/${movieId}`);
  };

  return (
    <main className="relative min-h-[calc(100vh-5.5rem)] overflow-hidden bg-[#030711] text-[#f7f1e7]">
      <audio
        ref={audioRef}
        src="/audio/space-ambient.mp3"
        loop
        preload="metadata"
        className="hidden"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(15,39,82,0.28),transparent_47%),linear-gradient(180deg,#01030a_0%,#030a18_58%,#01030a_100%)]" />
      <div className="pointer-events-none absolute -left-24 top-[28%] size-64 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(115,161,220,0.2),rgba(30,58,108,0.1)_45%,transparent_72%)] opacity-75" />
      <div className="pointer-events-none absolute -right-28 top-[48%] size-80 rounded-full border border-[#9fc8ef]/10 bg-[radial-gradient(circle_at_35%_30%,rgba(213,179,109,0.12),rgba(21,40,74,0.12)_48%,transparent_72%)] opacity-70" />
      <div className="pointer-events-none absolute -right-20 top-[48%] h-24 w-96 -rotate-[18deg] rounded-[50%] border border-[#9fc8ef]/10 opacity-50" />
      <header className="relative z-20 mx-auto flex w-full max-w-7xl justify-end px-5 py-7 sm:px-8 lg:px-12">
        <button
          type="button"
          onClick={toggleSpaceSound}
          aria-pressed={!isSpaceSoundMuted}
          aria-label={isSpaceSoundMuted ? "우주 소리 켜기" : "우주 소리 음소거"}
          className={`flex size-10 items-center justify-center rounded-full border backdrop-blur-md transition hover:border-[#d5b36d]/50 hover:text-[#f5d68f] ${isSpaceSoundMuted ? "border-white/15 bg-white/[0.04] text-white/55" : "border-[#d5b36d]/65 bg-[#d5b36d]/10 text-[#f5d68f]"}`}
        >
          {isSpaceSoundMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </header>
      <section className="relative mx-auto h-[calc(100vh-10rem)] min-h-[34rem] w-full max-w-7xl overflow-hidden px-5 pb-10 sm:px-8 lg:px-12">
        <div
          ref={universeViewportRef}
          className="absolute inset-0 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div
            className="relative bg-[#030711]"
            style={{ height: universeHeight, width: universeWidth }}
          >
          <div className="absolute left-1/2 top-3 -translate-x-1/2 text-center text-[10px] tracking-[0.3em] text-white/25">
            DISTANT LIGHTS
          </div>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {movieLinks.map((link) => (
              <line
                key={`${link.from.movie.movieId}-${link.to.movie.movieId}`}
                x1={Number.parseFloat(link.from.left)}
                y1={Number.parseFloat(link.from.top)}
                x2={Number.parseFloat(link.to.left)}
                y2={Number.parseFloat(link.to.top)}
                stroke={link.accent}
                strokeOpacity="0.58"
                strokeWidth="0.28"
              />
            ))}
          </svg>
          {stars.map(({ movie, left, top, size, accent }) => (
            <button
              key={movie.movieId}
              type="button"
              aria-label={`${movie.title} 영화 별 보기`}
              onClick={() => {
                const constellation = movieConstellationById.get(movie.movieId);
                if (constellation) inspect(constellation);
              }}
              className="pointer-events-auto absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b36d]"
              style={{ left, top }}
            >
              <span
                className="pointer-events-none absolute -inset-3 rounded-full blur-md"
                style={{ boxShadow: `0 0 16px 2px ${accent}66` }}
              />
              <span
                className={`pointer-events-none relative block ${size} rounded-full bg-[#fff9df] shadow-[0_0_10px_3px_rgba(255,249,223,0.8)]`}
              />
            </button>
          ))}
          {moviesQuery.isLoading && (
            <p className="absolute left-1/2 top-1/2 -translate-x-1/2 text-xs tracking-[0.12em] text-white/40">
              별빛을 불러오는 중
            </p>
          )}
          {!moviesQuery.isLoading && movies.length === 0 && (
            <p className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 text-center text-sm text-white/40">
              영화를 기록하면 이곳에 별이 생깁니다.
            </p>
          )}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 z-20">
          <div className="pointer-events-auto absolute inset-0">
            <Observer onInspect={() => targets[0] && inspect(targets[0])} />
          </div>
        </div>
      </section>
      {isMicroscopeOpen && selected && (
        <MicroscopeModal
          key={selected.id}
          constellation={selected}
          targets={targets}
          onClose={() => setIsMicroscopeOpen(false)}
          onMovieDetail={openMovieDetail}
        />
      )}
    </main>
  );
}

function MainConstellation({
  constellation,
  onClick,
}: {
  constellation: TagConstellation;
  onClick: () => void;
}) {
  const points = constellation.points.map(([x, y]) => `${x},${y}`).join(" ");
  return (
    <button
      type="button"
      onClick={onClick}
      className="group absolute h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d5b36d]"
      style={{ left: constellation.left, top: constellation.top }}
      aria-label={`${constellation.tag} 별자리 관측`}
    >
      <svg
        viewBox="0 0 140 100"
        className="absolute inset-0 h-full w-full overflow-visible opacity-45 transition group-hover:opacity-90"
        aria-hidden="true"
      >
        {constellation.lines.map(([from, to]) => {
          const a = constellation.points[from];
          const b = constellation.points[to];
          return (
            <line
              key={`${from}-${to}`}
              x1={a[0]}
              y1={a[1]}
              x2={b[0]}
              y2={b[1]}
              stroke={constellation.accent}
              strokeOpacity="0.7"
              strokeWidth="0.55"
            />
          );
        })}
        <polyline
          points={points}
          fill="none"
          stroke={constellation.accent}
          strokeOpacity="0.3"
          strokeWidth="0.35"
        />
        {constellation.points.map(([x, y, radius], index) => (
          <circle
            key={`${x}-${y}-${index}`}
            cx={x}
            cy={y}
            r={radius * 1.1}
            fill="#fff9df"
            opacity="0.85"
          />
        ))}
      </svg>
      <span
        className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] tracking-[0.14em] opacity-0 transition group-hover:opacity-80"
        style={{ color: constellation.accent }}
      >
        {constellation.tag} · {constellation.movieIds.length}편
      </span>
    </button>
  );
}

function Observer({ onInspect }: { onInspect: () => void }) {
  return (
    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center sm:bottom-6">
      <div className="relative h-44 w-[min(19rem,calc(100vw-2rem))] sm:h-52 sm:w-[22rem]">
        <svg
          viewBox="0 0 360 220"
          className="h-full w-full drop-shadow-[0_12px_22px_rgba(0,0,0,0.55)]"
          role="img"
          aria-label="현미경으로 별을 관측하는 캐릭터"
        >
          <defs>
            <linearGradient id="observer-body" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#253d63" />
              <stop offset="1" stopColor="#0d1b34" />
            </linearGradient>
            <linearGradient id="microscope-metal" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#e6c978" />
              <stop offset="1" stopColor="#99733a" />
            </linearGradient>
            <filter
              id="observer-glow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <ellipse
            cx="180"
            cy="205"
            rx="142"
            ry="6"
            fill="#020611"
            opacity="0.8"
          />
          <g>
            <path
              d="M72 198c0-34 20-61 52-61s52 27 52 61Z"
              fill="url(#observer-body)"
              stroke="#7893bb"
              strokeOpacity="0.5"
            />
            <path
              d="M89 151c10-11 21-17 35-17s26 6 36 17"
              fill="none"
              stroke="#9eb5d5"
              strokeOpacity="0.45"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx="124"
              cy="101"
              r="38"
              fill="#263f66"
              stroke="#b5d3e8"
              strokeOpacity="0.8"
              strokeWidth="2"
            />
            <path
              d="M90 102c3-20 16-31 34-31 17 0 30 11 34 30-16 12-51 13-68 1Z"
              fill="#07152b"
              stroke="#87a8d2"
              strokeOpacity="0.45"
              strokeWidth="2"
            />
            <path
              d="M102 83c10-6 24-6 35 0"
              fill="none"
              stroke="#e2c886"
              strokeOpacity="0.52"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="145"
              cy="95"
              r="4"
              fill="#f5d68f"
              filter="url(#observer-glow)"
            />
            <path
              d="M157 154c15-7 28-13 38-26"
              fill="none"
              stroke="#31547c"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <circle
              cx="195"
              cy="127"
              r="7"
              fill="#b5d3e8"
              stroke="#d5b36d"
              strokeWidth="2"
            />
            <circle cx="124" cy="138" r="6" fill="#d5b36d" opacity="0.9" />
          </g>
          <g>
            <path
              d="M174 198h124"
              stroke="url(#microscope-metal)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M248 194V94"
              stroke="url(#microscope-metal)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M248 101c-20 7-35 1-40-16-4-13 2-27 14-38"
              fill="none"
              stroke="url(#microscope-metal)"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d="M217 46 245 32"
              stroke="#f0d58c"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M208 45 198 36"
              stroke="#b58b45"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M245 91h-28"
              stroke="#d5b36d"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <circle
              cx="203"
              cy="93"
              r="12"
              fill="#0b1d35"
              stroke="#d5b36d"
              strokeWidth="3"
              filter="url(#observer-glow)"
            />
            <path
              d="M225 124h32"
              stroke="#91a7c5"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M218 145h44"
              stroke="#91a7c5"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="248" cy="198" r="6" fill="#f5d68f" />
          </g>
        </svg>
        <button
          type="button"
          onClick={onInspect}
          className="absolute left-[55%] top-[11%] h-[38%] w-[27%] rounded-2xl bg-transparent transition hover:bg-[#d5b36d]/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5d68f]"
          aria-label="현미경으로 별자리 보기"
        />
      </div>
    </div>
  );
}

function MicroscopeModal({
  constellation,
  targets,
  onClose,
  onMovieDetail,
}: {
  constellation: Constellation;
  targets: Constellation[];
  onClose: () => void;
  onMovieDetail: (movieId: string) => void;
}) {
  const initialIndex = Math.max(
    0,
    targets.findIndex((item) => item.id === constellation.id),
  );
  const [viewIndex, setViewIndex] = useState(initialIndex);
  const [dragStartX, setDragStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const observed = targets[viewIndex] ?? constellation;
  const moveBy = (delta: number) =>
    setViewIndex((current) =>
      Math.max(0, Math.min(targets.length - 1, current + delta)),
    );
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStartX(event.clientX);
    setIsDragging(true);
  };
  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (Math.abs(event.clientX - dragStartX) > 42)
      moveBy(event.clientX < dragStartX ? 1 : -1);
    setIsDragging(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        moveBy(-1);
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        moveBy(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, targets.length]);

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden bg-[#02050e] text-[#f7f1e7]">
      <div className="relative h-full w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(25,63,120,0.34),transparent_45%),linear-gradient(180deg,#02050e_0%,#06142d_56%,#01030a_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-90 [background-image:radial-gradient(circle_at_8%_14%,rgba(255,255,255,0.95)_0_0.8px,transparent_1.5px),radial-gradient(circle_at_19%_72%,rgba(170,212,255,0.78)_0_0.8px,transparent_1.6px),radial-gradient(circle_at_35%_23%,rgba(255,239,190,0.82)_0_0.9px,transparent_1.7px),radial-gradient(circle_at_52%_12%,rgba(255,255,255,0.84)_0_0.7px,transparent_1.5px),radial-gradient(circle_at_73%_62%,rgba(182,216,255,0.76)_0_0.8px,transparent_1.6px),radial-gradient(circle_at_91%_25%,rgba(255,241,193,0.8)_0_0.9px,transparent_1.7px)]" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-[max(1.25rem,calc(env(safe-area-inset-top)+1.25rem))] z-30 p-2 text-white/45 transition hover:text-white sm:right-8 sm:top-8"
          aria-label="현미경 닫기"
        >
          <X className="size-5" />
        </button>
        <div className="pointer-events-none absolute left-5 top-[max(1.25rem,calc(env(safe-area-inset-top)+1.25rem))] z-20 sm:left-8 sm:top-8">
          <p className="text-[9px] font-semibold tracking-[0.42em] text-[#d5b36d]/75 sm:text-[10px]">
            THROUGH THE MICROSCOPE
          </p>
          <p className="mt-2 text-xs text-white/45">
            {observed.title} · {observed.subtitle}
          </p>
        </div>
        <div
          className={`relative h-full w-full overflow-hidden ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => setIsDragging(false)}
          style={{ touchAction: "none" }}
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.82))]" />
          <div className="absolute left-1/2 top-[48%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <div className="absolute -inset-24 rounded-full bg-[#d5b36d]/10 blur-3xl" />
            <div className="relative">
              <MicroscopeConstellation
                constellation={observed}
                className="relative w-[235px] drop-shadow-[0_0_18px_rgba(255,249,223,0.45)] sm:w-[320px] lg:w-[390px]"
              />
            </div>
            <span
              className="relative mt-2 text-[10px] font-medium tracking-[0.28em]"
              style={{ color: observed.accent }}
            >
              {observed.label}
            </span>
            <p className="mt-2 max-w-[260px] text-center text-[10px] text-white/35">
              {observed.movieIds.length}편의 영화 기록이 이 별자리를 만듦
            </p>
            {observed.movieIds.length === 1 && (
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onMovieDetail(observed.movieIds[0])}
                className="pointer-events-auto mt-5 inline-flex items-center gap-2 rounded-full bg-[#d5b36d] px-6 py-3 text-sm font-semibold text-[#02050e] shadow-[0_8px_30px_rgba(213,179,109,0.18)] transition hover:bg-[#e6c978]"
                aria-label={`${observed.title} 영화 상세 보기`}
              >
                영화 상세 보기 <ChevronRight className="size-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => moveBy(-1)}
            disabled={viewIndex === 0}
            className="absolute left-5 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-white/[0.04] p-3 text-white/70 transition hover:border-[#d5b36d]/60 hover:text-[#f5d68f] disabled:cursor-not-allowed disabled:opacity-20"
            aria-label="이전 별자리 보기"
          >
            <ChevronLeft className="size-7" />
          </button>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => moveBy(1)}
            disabled={viewIndex === targets.length - 1}
            className="absolute right-5 top-1/2 z-10 rounded-full border border-white/15 bg-white/[0.04] p-3 text-white/70 transition hover:border-[#d5b36d]/60 hover:text-[#f5d68f] disabled:cursor-not-allowed disabled:opacity-20"
            aria-label="다음 별자리 보기"
          >
            <ChevronRight className="size-7" />
          </button>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => moveBy(-1)}
            disabled={viewIndex === 0}
            className="absolute left-1/2 top-20 z-10 -translate-x-1/2 rounded-full border border-white/15 bg-white/[0.04] p-2 text-white/70 transition hover:border-[#d5b36d]/60 hover:text-[#f5d68f] disabled:opacity-20"
            aria-label="위쪽 별자리 보기"
          >
            <ChevronUp className="size-5" />
          </button>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => moveBy(1)}
            disabled={viewIndex === targets.length - 1}
            className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/15 bg-white/[0.04] p-2 text-white/70 transition hover:border-[#d5b36d]/60 hover:text-[#f5d68f] disabled:opacity-20"
            aria-label="아래쪽 별자리 보기"
          >
            <ChevronDown className="size-5" />
          </button>
        </div>
        <div className="pointer-events-none absolute bottom-5 left-5 right-5 z-20 flex items-end justify-between gap-4 sm:bottom-8 sm:left-8 sm:right-8">
          <div>
            <p className="text-xs text-[#d5b36d]/85">
              현재 관측 · {observed.title}
            </p>
            <p className="mt-1 text-[10px] text-white/35">
              {observed.subtitle}
            </p>
          </div>
          <div
            className="pointer-events-auto flex items-center gap-1.5"
            aria-label="별자리 위치"
          >
            {targets.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setViewIndex(index)}
                aria-label={`${item.title}로 이동`}
                className={`size-2 rounded-full transition ${index === viewIndex ? "bg-[#d5b36d] shadow-[0_0_10px_#d5b36d]" : "bg-white/25 hover:bg-white/60"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MicroscopeConstellation({
  constellation,
  className,
}: {
  constellation: Constellation;
  className: string;
}) {
  return (
    <svg
      viewBox="0 0 140 230"
      className={className}
      aria-hidden="true"
    >
      {constellation.lines.map(([from, to]) => {
        const a = constellation.points[from];
        const b = constellation.points[to];
        return (
          <line
            key={`${from}-${to}`}
            x1={a[0]}
            y1={a[1]}
            x2={b[0]}
            y2={b[1]}
            stroke={constellation.accent}
            strokeOpacity="0.72"
            strokeWidth="0.8"
          />
        );
      })}
      {constellation.points.map(([x, y, radius], index) => (
        <circle
          key={`${x}-${y}-${index}`}
          cx={x}
          cy={y}
          r={radius * 1.7}
          fill="#fff9df"
          opacity={index % 3 === 0 ? 1 : 0.8}
          className="pointer-events-none drop-shadow-[0_0_5px_#fff7d5]"
        />
      ))}
    </svg>
  );
}
