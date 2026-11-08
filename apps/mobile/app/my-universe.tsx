import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { CINEMO_COLORS } from "@cinemo/shared";
import type { MyMovie } from "@/lib/api/my-cinema";
import { myMoviesQueryOptions } from "@/lib/queries/my-cinema.query";

const spaceAmbient = require("@/assets/audio/space-ambient.mp3");

type ExpoAudioApi = typeof import("expo-audio");

let expoAudio: ExpoAudioApi | null = null;
try {
  expoAudio = require("expo-audio") as ExpoAudioApi;
} catch {
  // 이전 개발 빌드에서도 그래프 자체는 표시함.
}

let activeAmbientPlayer: { pause: () => void } | null = null;

const SPACE = "#020611";
const CANVAS = "#030817";
const GOLD = CINEMO_COLORS.accentLight;
const IVORY = "#f8f2e8";
const WORLD_WIDTH = 1400;
const MIN_WORLD_HEIGHT = 1750;
const MIN_SCALE = 0.025;
const MAX_SCALE = 2.4;
const PAN_GESTURE_THRESHOLD = 6;

type StarNode = {
  movie: MyMovie;
  x: number;
  y: number;
  size: number;
};

type StarLink = {
  from: StarNode;
  to: StarNode;
  bend?: number;
};

type Transform = { x: number; y: number; scale: number };

type GraphBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function readTouches(event: GestureResponderEvent) {
  const [first, second] = event.nativeEvent.touches;
  if (!first) return null;
  if (!second) return { key: String(first.identifier), x: first.pageX, y: first.pageY, distance: 0 };

  return {
    key: [first.identifier, second.identifier].sort().join(":"),
    x: (first.pageX + second.pageX) / 2,
    y: (first.pageY + second.pageY) / 2,
    distance: Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY),
  };
}

type StarPosition = { x: number; y: number };

function constellationPositions(
  group: MyMovie[],
  neighbors: Map<string, string[]>,
  index: number,
): Map<string, StarPosition> {
  const positions = new Map<string, StarPosition>();
  const first = group[0].movieId;
  if (!neighbors.has(first)) {
    const sky = [[0.20, 0.30], [0.65, 0.18], [0.44, 0.66], [0.83, 0.52]];
    group.forEach(({ movieId }, i) => {
      positions.set(movieId, { x: sky[i][0], y: sky[i][1] });
    });
    return positions;
  }

  function farthestPath(start: string) {
    const queue = [start];
    const parent = new Map<string, string | null>([[start, null]]);
    for (const current of queue) {
      for (const next of neighbors.get(current) ?? []) {
        if (parent.has(next)) continue;
        parent.set(next, current);
        queue.push(next);
      }
    }

    const path = [];
    for (let current: string | null = queue[queue.length - 1]; current; current = parent.get(current) ?? null) {
      path.push(current);
    }
    return path;
  }

  const spine = farthestPath(farthestPath(first)[0]);
  const spineSet = new Set(spine);
  const spacing = 0.74 / (spine.length - 1);
  const direction = index % 2 === 0 ? 1 : -1;
  const span = spacing * 0.88;

  function placeBranches(parent: string, children: string[], left: number, width: number, y: number, step: number) {
    children.forEach((child, branchIndex) => {
      const slotWidth = width / children.length;
      const slotLeft = left + branchIndex * slotWidth;
      const nextY = y + step;
      positions.set(child, { x: slotLeft + slotWidth / 2, y: nextY });
      placeBranches(
        child,
        (neighbors.get(child) ?? []).filter((next) => next !== parent),
        slotLeft,
        slotWidth,
        nextY,
        step * 0.55,
      );
    });
  }

  spine.forEach((movieId, pointIndex) => {
    const progress = pointIndex / (spine.length - 1);
    const x = 0.13 + pointIndex * spacing;
    const y = 0.45 + direction * (0.19 * (progress - 0.5) + 0.12 * Math.sin(progress * Math.PI));
    positions.set(movieId, { x, y });

    const branches = (neighbors.get(movieId) ?? []).filter((next) => !spineSet.has(next));
    placeBranches(movieId, branches.filter((_, i) => i % 2 === 0), x - span / 2, span, y, -0.19);
    placeBranches(movieId, branches.filter((_, i) => i % 2 === 1), x - span / 2, span, y, 0.19);
  });

  return positions;
}

function seriesTitle(title: string) {
  const normalized = title.normalize("NFKC").toLowerCase().trim();
  const suffix = /(?:[\s:：·–—-]+(?:part|파트|제)[\s.]*(?:\d+|[ivxlcdm]+)(?:\s*(?:부|편))?|[\s:：·–—-]+\d+\s*(?:부|편)?|\d+\s*(?:부|편))\s*$/iu;
  const base = normalized.replace(suffix, "");
  return {
    key: base.replace(/[^\p{L}\p{N}]/gu, ""),
    numbered: base !== normalized,
  };
}

function movieRelation(first: MyMovie, second: MyMovie) {
  const firstSeries = seriesTitle(first.title);
  const secondSeries = seriesTitle(second.title);
  if (firstSeries.key.length >= 2 && firstSeries.key === secondSeries.key &&
      (firstSeries.numbered || secondSeries.numbered)) {
    return 100;
  }

  const sharedPerson = (key: "directors" | "actors") =>
    (first[key] ?? []).find((person) => (second[key] ?? []).some(({ id }) => id === person.id));
  const director = sharedPerson("directors");
  if (director) return 30;

  const actor = sharedPerson("actors");
  if (actor) return 20;

  const genres = [...new Set((first.genres ?? []).map((genre) => genre.trim()))]
    .filter((genre) => genre && (second.genres ?? []).some((value) => value.trim() === genre));
  if (genres.length >= 2) return 10;
  return null;
}

function linkPath({ from, to, bend }: StarLink) {
  const start = `M ${from.x} ${from.y}`;
  const end = `${to.x} ${to.y}`;
  if (!bend) return `${start} L ${end}`;

  const controlX = (from.x + to.x) / 2 - (to.y - from.y) * bend;
  const controlY = (from.y + to.y) / 2 + (to.x - from.x) * bend;
  return `${start} Q ${controlX} ${controlY} ${end}`;
}

function createStarMap(movies: MyMovie[]) {
  const ordered = [...movies].sort((a, b) => a.title.localeCompare(b.title, "ko", { numeric: true }) ||
    a.movieId.localeCompare(b.movieId));
  type Relation = { first: MyMovie; second: MyMovie; score: number };
  const candidates: Relation[] = [];
  ordered.forEach((first, index) => {
    for (const second of ordered.slice(index + 1)) {
      const score = movieRelation(first, second);
      if (score) candidates.push({ first, second, score });
    }
  });
  candidates.sort((a, b) => b.score - a.score);

  const groupByMovie = new Map(ordered.map((movie) => [movie.movieId, [movie]]));
  const connections: Relation[] = [];
  for (const candidate of candidates) {
    const first = groupByMovie.get(candidate.first.movieId)!;
    const second = groupByMovie.get(candidate.second.movieId)!;
    if (first === second || (candidate.score < 100 && first.length + second.length > 7)) continue;

    const group = [...first, ...second];
    for (const movie of group) groupByMovie.set(movie.movieId, group);
    connections.push(candidate);
  }

  const neighbors = new Map<string, string[]>();
  for (const { first, second } of connections) {
    neighbors.set(first.movieId, [...(neighbors.get(first.movieId) ?? []), second.movieId]);
    neighbors.set(second.movieId, [...(neighbors.get(second.movieId) ?? []), first.movieId]);
  }

  const groups = [...new Set(groupByMovie.values())];
  const clusters = groups.filter((group) => group.length > 1);
  const isolated = groups.filter((group) => group.length === 1).flat();
  for (let index = 0; index < isolated.length; index += 4) {
    clusters.push(isolated.slice(index, index + 4));
  }

  const height = Math.max(MIN_WORLD_HEIGHT, Math.ceil(clusters.length / 2) * 640 + 260);
  const stars = clusters.flatMap((group, index) => {
    const positions = constellationPositions(group, neighbors, index);
    const centered = clusters.length === 1 || (index === clusters.length - 1 && index % 2 === 0);
    const width = clusters.length === 1 ? 980 : 500;
    const left = centered ? (WORLD_WIDTH - width) / 2 : 155 + (index % 2) * 590;
    const top = 110 + Math.floor(index / 2) * 640 + (index % 2) * 90;

    return group.map((movie): StarNode => {
      const { x, y } = positions.get(movie.movieId)!;
      return {
        movie,
        x: left + x * width,
        y: top + y * (clusters.length === 1 ? 760 : 520),
        size: movie.isFavorite ? 23 : (neighbors.get(movie.movieId)?.length ?? 0) >= 2 ? 18 : 13,
      };
    });
  });
  const starByMovie = new Map(stars.map((star) => [star.movie.movieId, star]));
  const links: StarLink[] = connections.map(({ first, second, score }) => ({
    from: starByMovie.get(first.movieId)!,
    to: starByMovie.get(second.movieId)!,
    bend: score === 100 ? 0.06 : undefined,
  }));

  return { stars, links, height };
}

function getGraphBounds(stars: StarNode[], worldHeight: number): GraphBounds {
  if (!stars.length) {
    return {
      left: 0,
      right: WORLD_WIDTH,
      top: 0,
      bottom: worldHeight,
      width: WORLD_WIDTH,
      height: worldHeight,
      centerX: WORLD_WIDTH / 2,
      centerY: worldHeight / 2,
    };
  }

  const padding = 150;
  const left = Math.max(0, Math.min(...stars.map((star) => star.x - padding)));
  const right = Math.min(
    WORLD_WIDTH,
    Math.max(...stars.map((star) => star.x + padding)),
  );
  const top = Math.max(0, Math.min(...stars.map((star) => star.y - padding)));
  const bottom = Math.min(
    worldHeight,
    Math.max(...stars.map((star) => star.y + padding)),
  );

  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
  };
}

function SpaceAudio({ muted }: { muted: boolean }) {
  if (!expoAudio) return null;
  return <SpaceAudioPlayer audio={expoAudio} muted={muted} />;
}

function SpaceAudioPlayer({
  audio,
  muted,
}: {
  audio: ExpoAudioApi;
  muted: boolean;
}) {
  const player = audio.useAudioPlayer(spaceAmbient, { updateInterval: 500 });

  useEffect(() => {
    let disposed = false;
    const sync = async () => {
      try {
        await audio.setAudioModeAsync({ playsInSilentMode: true });
        if (disposed) return;

        player.loop = true;
        player.volume = 0.16;
        player.muted = muted;

        if (muted) {
          try {
            player.pause();
          } catch {}
          if (activeAmbientPlayer === player) activeAmbientPlayer = null;
          return;
        }

        if (activeAmbientPlayer && activeAmbientPlayer !== player) {
          try {
            activeAmbientPlayer.pause();
          } catch {}
        }
        activeAmbientPlayer = player;
        player.play();
      } catch {
        // 오디오 네이티브 모듈이 없는 개발 빌드는 무음으로 계속 사용함.
      }
    };
    void sync();

    return () => {
      disposed = true;
      if (activeAmbientPlayer === player) {
        try {
          player.pause();
        } catch {}
        activeAmbientPlayer = null;
      }
    };
  }, [audio, muted, player]);

  return null;
}

function MovieModal({
  movie,
  onClose,
}: {
  movie: MyMovie | null;
  onClose: () => void;
}) {
  if (!movie) return null;

  return (
    <Modal animationType="fade" transparent visible onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Pressable
            accessibilityLabel="닫기"
            hitSlop={12}
            onPress={onClose}
            style={styles.modalClose}
          >
            <Ionicons color={IVORY} name="close" size={26} />
          </Pressable>
          <Text style={styles.modalEyebrow}>OBSERVED STAR</Text>
          <View style={styles.modalPosterFrame}>
            {movie.posterUrl ? (
              <Image
                accessibilityLabel={`${movie.title} 포스터`}
                resizeMode="contain"
                source={{ uri: movie.posterUrl }}
                style={styles.modalPoster}
              />
            ) : (
              <Text style={styles.modalPosterFallback}>포스터 없음</Text>
            )}
          </View>
          <Text numberOfLines={2} style={styles.modalTitle}>
            {movie.title}
          </Text>
          <Text numberOfLines={2} style={styles.modalCopy}>
            {movie.releaseDate?.slice(0, 10) ?? "개봉일 정보 없음"}
            {movie.genres.length > 0 ? ` · ${movie.genres.join(" · ")}` : ""}
          </Text>
          <Pressable
            onPress={() => {
              onClose();
              router.push(`/movies/${movie.movieId}`);
            }}
            style={styles.detailButton}
          >
            <Text style={styles.detailButtonText}>영화 상세 보기</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function MyUniverseScreen() {
  const [selectedMovie, setSelectedMovie] = useState<MyMovie | null>(null);
  const [muted, setMuted] = useState(false);
  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const transformRef = useRef(transform);
  const canvasRef = useRef<View>(null);
  const canvasOrigin = useRef({ x: 0, y: 0 });
  const gestureRef = useRef<ReturnType<typeof readTouches> | null>(null);
  const moviesQuery = useQuery(myMoviesQueryOptions());
  const watchedMovies = useMemo(
    () => (moviesQuery.data ?? []).filter((movie) => movie.isWatched),
    [moviesQuery.data],
  );
  const graph = useMemo(() => createStarMap(watchedMovies), [watchedMovies]);
  const starClearance = useMemo(() => new Map(graph.stars.map((star) => [
    star.movie.movieId,
    graph.stars.reduce((nearest, other) => other === star
      ? nearest
      : Math.min(nearest, Math.hypot(star.x - other.x, star.y - other.y)), Infinity),
  ])), [graph.stars]);
  const worldHeight = graph.height;
  const graphBounds = useMemo(() => getGraphBounds(graph.stars, worldHeight), [graph.stars, worldHeight]);
  const signature = useMemo(
    () =>
      watchedMovies
        .map((movie) => movie.movieId)
        .sort()
        .join(":"),
    [watchedMovies],
  );
  const canvasReady = canvasSize.width > 0 && canvasSize.height > 0;

  const screenStars = graph.stars.map((star) => ({
    star,
    x: canvasSize.width / 2 + transform.x + (star.x - WORLD_WIDTH / 2) * transform.scale,
    y: canvasSize.height / 2 + transform.y + (star.y - worldHeight / 2) * transform.scale,
  })).filter(({ x, y }) => x >= 0 && x <= canvasSize.width && y >= 0 && y <= canvasSize.height);

  const labelHeight = 26;
  const starLabels: { star: StarNode; left: number; top: number; width: number }[] = [];
  if (transform.scale >= 0.56) {
    for (const { star, x, y } of screenStars) {
      // 제목의 폭만 줄이고 중심은 항상 별의 화면 좌표에 맞춘다.
      const width = Math.min(188, 2 * Math.min(x - 8, canvasSize.width - x - 8));
      if (width < 48) continue;

      const left = x - width / 2;
      const gap = star.size * Math.min(transform.scale, 0.8) / 2 + 4;
      const top = [y + gap, y - labelHeight - gap].find((candidate) =>
        candidate >= 8 &&
        candidate + labelHeight <= canvasSize.height - 72 &&
        !starLabels.some((label) =>
          label.left < left + width + 4 &&
          left < label.left + label.width + 4 &&
          Math.abs(label.top - candidate) < labelHeight,
        ) &&
        !screenStars.some((other) =>
          other.x >= left && other.x <= left + width &&
          other.y >= candidate - 3 && other.y <= candidate + labelHeight + 3,
        ),
      );
      if (top !== undefined) starLabels.push({ star, left, top, width });
    }
  }

  const handleCanvasLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    canvasRef.current?.measure((_x, _y, _width, _height, pageX, pageY) => {
      canvasOrigin.current = { x: pageX, y: pageY };
    });
    setCanvasSize((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  };

  const updateTransform = (next: Transform) => {
    if (!canvasReady) return;

    const scale = clamp(next.scale, MIN_SCALE, MAX_SCALE);
    const viewportLeft = 32;
    const viewportRight = Math.max(viewportLeft + 1, canvasSize.width - 32);
    const viewportTop = 32;
    const viewportBottom = Math.max(viewportTop + 1, canvasSize.height - 104);

    const contentLeft = (graphBounds.left - WORLD_WIDTH / 2) * scale;
    const contentRight = (graphBounds.right - WORLD_WIDTH / 2) * scale;
    const contentTop = (graphBounds.top - worldHeight / 2) * scale;
    const contentBottom = (graphBounds.bottom - worldHeight / 2) * scale;
    const centeredX =
      (viewportLeft + viewportRight) / 2 -
      canvasSize.width / 2 -
      (graphBounds.centerX - WORLD_WIDTH / 2) * scale;
    const centeredY =
      (viewportTop + viewportBottom) / 2 -
      canvasSize.height / 2 -
      (graphBounds.centerY - worldHeight / 2) * scale;
    const slack = 52;
    const minX = Math.min(centeredX, viewportRight - canvasSize.width / 2 - contentRight) - slack;
    const maxX = Math.max(centeredX, viewportLeft - canvasSize.width / 2 - contentLeft) + slack;
    const minY = Math.min(centeredY, viewportBottom - canvasSize.height / 2 - contentBottom) - slack;
    const maxY = Math.max(centeredY, viewportTop - canvasSize.height / 2 - contentTop) + slack;
    const safe = {
      scale,
      x: clamp(next.x, Math.min(minX, maxX), Math.max(minX, maxX)),
      y: clamp(next.y, Math.min(minY, maxY), Math.max(minY, maxY)),
    };
    transformRef.current = safe;
    setTransform(safe);
  };

  const resetUniverse = () => {
    if (!canvasReady) return;
    const scale = clamp(
      Math.min(
        Math.max(1, canvasSize.width - 64) / graphBounds.width,
        Math.max(1, canvasSize.height - 136) / graphBounds.height,
      ),
      MIN_SCALE,
      0.82,
    );
    updateTransform({
      scale,
      x: -(graphBounds.centerX - WORLD_WIDTH / 2) * scale,
      y: -36 - (graphBounds.centerY - worldHeight / 2) * scale,
    });
  };

  useEffect(() => {
    resetUniverse();
    // 관람 목록 또는 화면 크기가 바뀔 때만 전체 우주를 다시 맞춤.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canvasReady,
    canvasSize.height,
    canvasSize.width,
    graphBounds,
    signature,
  ]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: (event) => event.nativeEvent.touches.length > 1,
        onMoveShouldSetPanResponderCapture: (event, gesture) =>
          event.nativeEvent.touches.length > 1 ||
          Math.hypot(gesture.dx, gesture.dy) > PAN_GESTURE_THRESHOLD,
        onPanResponderGrant: (event) => {
          gestureRef.current = readTouches(event);
        },
        onPanResponderMove: (event) => {
          const next = readTouches(event);
          const previous = gestureRef.current;
          gestureRef.current = next;
          if (!next || !previous || next.key !== previous.key) return;

          const current = transformRef.current;
          const scale = previous.distance > 0 && next.distance > 0
            ? clamp(current.scale * (next.distance / previous.distance), MIN_SCALE, MAX_SCALE)
            : current.scale;
          const ratio = scale / current.scale;
          const centerX = canvasOrigin.current.x + canvasSize.width / 2;
          const centerY = canvasOrigin.current.y + canvasSize.height / 2;
          updateTransform({
            scale,
            x: next.x - centerX - (previous.x - centerX - current.x) * ratio,
            y: next.y - centerY - (previous.y - centerY - current.y) * ratio,
          });
        },
        onPanResponderRelease: () => { gestureRef.current = null; },
        onPanResponderTerminate: () => { gestureRef.current = null; },
      }),
    [canvasReady, canvasSize.height, canvasSize.width, graphBounds, worldHeight],
  );

  const changeScale = (factor: number) => {
    if (!canvasReady) return;
    const current = transformRef.current;
    const scale = clamp(current.scale * factor, MIN_SCALE, MAX_SCALE);
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    const worldX =
      WORLD_WIDTH / 2 +
      (centerX - canvasSize.width / 2 - current.x) / current.scale;
    const worldY =
      worldHeight / 2 +
      (centerY - canvasSize.height / 2 - current.y) / current.scale;
    updateTransform({
      scale,
      x: centerX - canvasSize.width / 2 - (worldX - WORLD_WIDTH / 2) * scale,
      y: centerY - canvasSize.height / 2 - (worldY - worldHeight / 2) * scale,
    });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <SpaceAudio muted={muted} />
      <View
        ref={canvasRef}
        {...panResponder.panHandlers}
        onLayout={handleCanvasLayout}
        style={styles.canvas}
      >
        {!canvasReady || moviesQuery.isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={GOLD} />
          </View>
        ) : watchedMovies.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons color={GOLD} name="sparkles-outline" size={28} />
            <Text style={styles.emptyTitle}>관람 기록이 아직 없습니다.</Text>
            <Text style={styles.emptyCopy}>
              영화를 기록하면 이곳에 별이 생겨요 별을 만들어 볼까요?
            </Text>
          </View>
        ) : (
          <View
            pointerEvents="box-none"
            style={[
              styles.worldAnchor,
              {
                left: canvasSize.width / 2 + transform.x,
                top: canvasSize.height / 2 + transform.y,
              },
            ]}
          >
            <View
              pointerEvents="box-none"
              style={[
                styles.world,
                {
                  left: -WORLD_WIDTH / 2,
                  top: -worldHeight / 2,
                  height: worldHeight,
                  transform: [{ scale: transform.scale }],
                },
              ]}
            >
              <Svg
                pointerEvents="none"
                height={worldHeight}
                style={StyleSheet.absoluteFill}
                width={WORLD_WIDTH}
              >
                {graph.links.map((link) => (
                  <Path
                    key={`${link.from.movie.movieId}-${link.to.movie.movieId}`}
                    d={linkPath(link)}
                    fill="none"
                    opacity={0.63}
                    stroke="#c7a878"
                    strokeWidth={0.75 / transform.scale}
                  />
                ))}
              </Svg>
              {graph.stars.map((star) => (
                <View
                  key={star.movie.movieId}
                  pointerEvents="none"
                  style={[
                    styles.starTouch,
                    { left: star.x - 42, top: star.y - 42 },
                  ]}
                >
                  <View
                    style={[
                      styles.starGlow,
                      {
                        width: star.size + 18,
                        height: star.size + 18,
                        borderRadius: 40,
                        transform: [{ scale: Math.min(1, 0.8 / transform.scale) }],
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.star,
                        {
                          width: star.size,
                          height: star.size,
                          borderRadius: star.size,
                        },
                      ]}
                    />
                  </View>

                </View>
              ))}
            </View>
          </View>
        )}

        {canvasReady && watchedMovies.length > 0 ? (
          <View pointerEvents="box-none" style={styles.starHitLayer}>
            {screenStars.map(({ star, x: screenX, y: screenY }) => {
              const clearance = starClearance.get(star.movie.movieId) ?? Infinity;
              const hitSize = Math.min(44, clearance * transform.scale / Math.SQRT2);

              return (
                <Pressable
                  accessibilityLabel={`${star.movie.title} 상세 보기`}
                  accessibilityRole="button"
                  key={`hit-${star.movie.movieId}`}
                  onPress={() => setSelectedMovie(star.movie)}
                  style={[
                    styles.starHitArea,
                    {
                      left: screenX - hitSize / 2,
                      top: screenY - hitSize / 2,
                      width: hitSize,
                      height: hitSize,
                    },
                  ]}
                />
              );
            })}
            {starLabels.map(({ star, left, top, width }) => (
              <Pressable
                key={`label-${star.movie.movieId}`}
                onPress={() => setSelectedMovie(star.movie)}
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[styles.starLabelPosition, { left, top, width, height: labelHeight }]}
              >
                <Text numberOfLines={1} maxFontSizeMultiplier={1.25} style={styles.starLabel}>
                  {star.movie.title}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {canvasReady && watchedMovies.length > 0 ? (
          <View pointerEvents="box-none" style={styles.controls}>
            <View style={styles.zoomControl}>
              <Pressable
                accessibilityLabel="축소"
                hitSlop={8}
                onPress={() => changeScale(1 / 1.35)}
                style={styles.zoomButton}
              >
                <Ionicons color={IVORY} name="remove" size={20} />
              </Pressable>
              <Text style={styles.zoomText}>
                {Math.round(transform.scale * 100)}%
              </Text>
              <Pressable
                accessibilityLabel="확대"
                hitSlop={8}
                onPress={() => changeScale(1.35)}
                style={styles.zoomButton}
              >
                <Ionicons color={IVORY} name="add" size={20} />
              </Pressable>
              <Pressable
                accessibilityLabel="전체 보기"
                hitSlop={8}
                onPress={resetUniverse}
                style={styles.zoomButton}
              >
                <Ionicons color={GOLD} name="scan-outline" size={18} />
              </Pressable>
              <Pressable
                accessibilityLabel={muted ? "우주 소리 켜기" : "우주 소리 끄기"}
                hitSlop={8}
                onPress={() => setMuted((value) => !value)}
                style={styles.zoomButton}
              >
                <Ionicons
                  color={GOLD}
                  name={muted ? "volume-mute-outline" : "volume-high-outline"}
                  size={18}
                />
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: SPACE },
  canvas: { flex: 1, overflow: "hidden", backgroundColor: CANVAS },
  worldAnchor: { position: "absolute", width: 1, height: 1 },
  world: { position: "absolute", width: WORLD_WIDTH },
  loadingState: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  emptyTitle: { marginTop: 12, color: IVORY, fontSize: 21, fontWeight: "700" },
  emptyCopy: { marginTop: 8, color: "#9aa5b6", fontSize: 14 },
  starTouch: {
    position: "absolute",
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  starHitLayer: { ...StyleSheet.absoluteFill, zIndex: 1 },
  starHitArea: {
    position: "absolute",
  },
  starGlow: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(227,196,113,0.08)",
    shadowColor: "#e6ca7d",
    shadowOpacity: 0.56,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  star: {
    backgroundColor: "#fff3cf",
    shadowColor: "#fff3cf",
    shadowOpacity: 0.9,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
  },
  starLabelPosition: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  starLabel: {
    maxWidth: "100%",
    backgroundColor: "rgba(3, 8, 23, 0.88)",
    borderRadius: 6,
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 3,
    textAlign: "center",
    color: IVORY,
    fontSize: 14,
    fontWeight: "600",
  },
  controls: { position: "absolute", right: 18, bottom: 18, zIndex: 2 },
  zoomControl: {
    flexDirection: "row",
    alignItems: "center",
    height: 42,
    paddingHorizontal: 4,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(226,231,242,0.2)",
    backgroundColor: "rgba(3,8,21,0.86)",
  },
  zoomButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomText: {
    width: 48,
    color: "#d4d8df",
    fontSize: 12,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(1,4,12,0.82)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(220,191,112,0.55)",
    padding: 24,
    backgroundColor: "#09152b",
  },
  modalClose: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 1,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  modalEyebrow: {
    alignSelf: "stretch",
    marginTop: 8,
    color: GOLD,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.6,
  },
  modalPosterFrame: {
    width: "100%",
    height: 244,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#071225",
  },
  modalPoster: { width: "100%", height: "100%" },
  modalPosterFallback: { color: "#aeb8c8", fontSize: 14 },
  modalTitle: {
    alignSelf: "stretch",
    marginTop: 18,
    color: IVORY,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "left",
  },
  modalCopy: {
    alignSelf: "stretch",
    marginTop: 10,
    color: "#aeb8c8",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "left",
  },
  detailButton: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 52,
    marginTop: 28,
    borderRadius: 16,
    backgroundColor: GOLD,
  },
  detailButtonText: { color: SPACE, fontSize: 16, fontWeight: "800" },
});
