import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line } from "react-native-svg";

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
const WORLD_WIDTH = 1800;
const WORLD_HEIGHT = 1200;
const MIN_SCALE = 0.12;
const MAX_SCALE = 1.7;
const PAN_GESTURE_THRESHOLD = 12;

type StarNode = {
  movie: MyMovie;
  x: number;
  y: number;
  size: number;
};

type StarLink = {
  from: StarNode;
  to: StarNode;
  color: string;
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

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function unit(value: string, salt: string) {
  return hash(`${salt}:${value}`) / 0xffffffff;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizedGenre(genre: string) {
  return genre.trim().replace(/\s+/g, " ");
}

function sharedPeople(first: MyMovie, second: MyMovie, key: "directors" | "actors") {
  const ids = new Set((second[key] ?? []).map((person) => person.id));
  return (first[key] ?? []).filter((person) => ids.has(person.id));
}

function sharedGenres(first: MyMovie, second: MyMovie) {
  const genres = new Set((second.genres ?? []).map(normalizedGenre).filter(Boolean));
  return (first.genres ?? []).map(normalizedGenre).filter((genre) => genres.has(genre));
}

function createStars(movies: MyMovie[]) {
  const placed: StarNode[] = [];

  for (const movie of movies) {
    let x = 140 + unit(movie.movieId, "x") * (WORLD_WIDTH - 280);
    let y = 130 + unit(movie.movieId, "y") * (WORLD_HEIGHT - 260);

    // 같은 데이터면 같은 좌표를 쓰되, 겹치는 별만 최소한으로 밀어냄.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const overlap = placed.some((star) => Math.hypot(star.x - x, star.y - y) < 112);
      if (!overlap) break;
      const angle = unit(movie.movieId, `angle-${attempt}`) * Math.PI * 2;
      x = clamp(x + Math.cos(angle) * 126, 100, WORLD_WIDTH - 100);
      y = clamp(y + Math.sin(angle) * 126, 100, WORLD_HEIGHT - 100);
    }

    placed.push({ movie, x, y, size: movie.isFavorite ? 28 : 22 });
  }

  return placed;
}

function segmentsCross(first: StarLink, second: StarLink) {
  const cross = (a: number, b: number, c: number, d: number, e: number, f: number) =>
    (c - a) * (f - b) - (d - b) * (e - a);
  const a = cross(first.from.x, first.from.y, first.to.x, first.to.y, second.from.x, second.from.y);
  const b = cross(first.from.x, first.from.y, first.to.x, first.to.y, second.to.x, second.to.y);
  const c = cross(second.from.x, second.from.y, second.to.x, second.to.y, first.from.x, first.from.y);
  const d = cross(second.from.x, second.from.y, second.to.x, second.to.y, first.to.x, first.to.y);
  return a * b < 0 && c * d < 0;
}

// 별자리 전체의 크기는 제한하지 않는다. 한 별에서만 가까운 관계를
// 네 갈래까지 유지해 한 지점에 선이 과하게 얽히는 것을 막는다.
const MAX_CONSTELLATION_BRANCHES = 4;
const MAX_CONSTELLATION_LINK_DISTANCE = 620;

function createsConstellationCycle(links: StarLink[], fromId: string, toId: string) {
  const neighbors = new Map<string, string[]>();
  const connect = (source: string, target: string) => {
    const current = neighbors.get(source) ?? [];
    current.push(target);
    neighbors.set(source, current);
  };

  for (const link of links) {
    const source = link.from.movie.movieId;
    const target = link.to.movie.movieId;
    connect(source, target);
    connect(target, source);
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

function createStarMap(movies: MyMovie[]) {
  const stars = createStars(movies);
  const starById = new Map(stars.map((star) => [star.movie.movieId, star]));
  const candidates: Array<StarLink & { score: number }> = [];

  for (let left = 0; left < movies.length; left += 1) {
    for (let right = left + 1; right < movies.length; right += 1) {
      const first = movies[left];
      const second = movies[right];
      const from = starById.get(first.movieId);
      const to = starById.get(second.movieId);
      if (!from || !to) continue;

      const directors = sharedPeople(first, second, "directors");
      const actors = sharedPeople(first, second, "actors");
      const genres = sharedGenres(first, second);
      const hasStrongRelation =
        directors.length > 0 || actors.length > 0 || genres.length >= 2;
      if (!hasStrongRelation) continue;

      const distance = Math.hypot(from.x - to.x, from.y - to.y);
      if (distance > MAX_CONSTELLATION_LINK_DISTANCE) {
        continue;
      }

      candidates.push({
        from,
        to,
        color: "#a8b9d0",
        score:
          directors.length * 2600 +
          actors.length * 750 +
          genres.length * 260 -
          distance * 0.6,
      });
    }
  }

  candidates.sort((left, right) => right.score - left.score);
  const degrees = new Map<string, number>();
  const links: StarLink[] = [];

  for (const candidate of candidates) {
    const fromId = candidate.from.movie.movieId;
    const toId = candidate.to.movie.movieId;
    if (
      (degrees.get(fromId) ?? 0) >= MAX_CONSTELLATION_BRANCHES ||
      (degrees.get(toId) ?? 0) >= MAX_CONSTELLATION_BRANCHES
    ) {
      continue;
    }
    if (createsConstellationCycle(links, fromId, toId)) continue;
    if (links.some((link) => segmentsCross(link, candidate))) continue;

    links.push(candidate);
    degrees.set(fromId, (degrees.get(fromId) ?? 0) + 1);
    degrees.set(toId, (degrees.get(toId) ?? 0) + 1);
  }

  return { stars, links };
}

function getGraphBounds(stars: StarNode[]): GraphBounds {
  if (!stars.length) {
    return {
      left: 0,
      right: WORLD_WIDTH,
      top: 0,
      bottom: WORLD_HEIGHT,
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
      centerX: WORLD_WIDTH / 2,
      centerY: WORLD_HEIGHT / 2,
    };
  }

  const padding = 150;
  const left = Math.max(0, Math.min(...stars.map((star) => star.x - padding)));
  const right = Math.min(WORLD_WIDTH, Math.max(...stars.map((star) => star.x + padding)));
  const top = Math.max(0, Math.min(...stars.map((star) => star.y - padding)));
  const bottom = Math.min(WORLD_HEIGHT, Math.max(...stars.map((star) => star.y + padding)));

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

function SpaceAudioPlayer({ audio, muted }: { audio: ExpoAudioApi; muted: boolean }) {
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

function MovieModal({ movie, onClose }: { movie: MyMovie | null; onClose: () => void }) {
  if (!movie) return null;

  return (
    <Modal animationType="fade" transparent visible onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Pressable accessibilityLabel="닫기" hitSlop={12} onPress={onClose} style={styles.modalClose}>
            <Ionicons color={IVORY} name="close" size={26} />
          </Pressable>
          <Text style={styles.modalEyebrow}>CINEMO UNIVERSE</Text>
          <View style={styles.modalStar} />
          <Text style={styles.modalTitle}>{movie.title}</Text>
          <Pressable
            onPress={() => {
              onClose();
              router.push(`/movies/${movie.movieId}`);
            }}
            style={styles.detailButton}
          >
            <Text style={styles.detailButtonText}>영화 상세 보기</Text>
            <Ionicons color={SPACE} name="arrow-forward" size={20} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function MyUniverseScreen() {
  const [selectedMovie, setSelectedMovie] = useState<MyMovie | null>(null);
  const [muted, setMuted] = useState(false);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const transformRef = useRef(transform);
  const gestureRef = useRef({ distance: 0, transform });
  const moviesQuery = useQuery(myMoviesQueryOptions());
  const watchedMovies = useMemo(
    () => (moviesQuery.data ?? []).filter((movie) => movie.isWatched),
    [moviesQuery.data],
  );
  const graph = useMemo(() => createStarMap(watchedMovies), [watchedMovies]);
  const graphBounds = useMemo(() => getGraphBounds(graph.stars), [graph.stars]);
  const signature = useMemo(
    () => watchedMovies.map((movie) => movie.movieId).sort().join(":"),
    [watchedMovies],
  );
  const canvasReady = canvasSize.width > 0 && canvasSize.height > 0;

  const handleCanvasLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasSize((current) =>
      current.width === width && current.height === height ? current : { width, height },
    );
  };

  const updateTransform = (next: Transform) => {
    if (!canvasReady) return;

    const scale = clamp(next.scale, MIN_SCALE, MAX_SCALE);
    const viewportLeft = 32;
    const viewportRight = Math.max(viewportLeft + 1, canvasSize.width - 32);
    const viewportTop = 32;
    const viewportBottom = Math.max(viewportTop + 1, canvasSize.height - 104);
    const viewportWidth = viewportRight - viewportLeft;
    const viewportHeight = viewportBottom - viewportTop;
    const scaledWidth = graphBounds.width * scale;
    const scaledHeight = graphBounds.height * scale;

    const contentLeft = (graphBounds.left - WORLD_WIDTH / 2) * scale;
    const contentRight = (graphBounds.right - WORLD_WIDTH / 2) * scale;
    const contentTop = (graphBounds.top - WORLD_HEIGHT / 2) * scale;
    const contentBottom = (graphBounds.bottom - WORLD_HEIGHT / 2) * scale;
    const centeredX =
      (viewportLeft + viewportRight) / 2 -
      canvasSize.width / 2 -
      (graphBounds.centerX - WORLD_WIDTH / 2) * scale;
    const centeredY =
      (viewportTop + viewportBottom) / 2 -
      canvasSize.height / 2 -
      (graphBounds.centerY - WORLD_HEIGHT / 2) * scale;
    const minX =
      scaledWidth <= viewportWidth
        ? centeredX
        : viewportLeft - canvasSize.width / 2 - contentLeft;
    const maxX =
      scaledWidth <= viewportWidth
        ? centeredX
        : viewportRight - canvasSize.width / 2 - contentRight;
    const minY =
      scaledHeight <= viewportHeight
        ? centeredY
        : viewportTop - canvasSize.height / 2 - contentTop;
    const maxY =
      scaledHeight <= viewportHeight
        ? centeredY
        : viewportBottom - canvasSize.height / 2 - contentBottom;
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
    updateTransform({ scale, x: 0, y: 0 });
  };

  useEffect(() => {
    resetUniverse();
    // 관람 목록 또는 화면 크기가 바뀔 때만 전체 우주를 다시 맞춤.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasReady, canvasSize.height, canvasSize.width, graphBounds, signature]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // 가벼운 탭은 별의 Pressable에 맡기고, 드래그·핀치만 우주 캔버스가 처리함.
        onStartShouldSetPanResponder: (_, gesture) => gesture.numberActiveTouches > 1,
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.numberActiveTouches > 1 ||
          Math.hypot(gesture.dx, gesture.dy) > PAN_GESTURE_THRESHOLD,
        onPanResponderGrant: (event) => {
          const touches = event.nativeEvent.touches;
          const distance = touches.length > 1
            ? Math.hypot(touches[1].locationX - touches[0].locationX, touches[1].locationY - touches[0].locationY)
            : 0;
          gestureRef.current = { distance, transform: transformRef.current };
        },
        onPanResponderMove: (event, gesture) => {
          const touches = event.nativeEvent.touches;
          const start = gestureRef.current;
          if (touches.length > 1 && start.distance > 0) {
            const distance = Math.hypot(touches[1].locationX - touches[0].locationX, touches[1].locationY - touches[0].locationY);
            const scale = start.transform.scale * (distance / start.distance);
            const focusX = (touches[0].locationX + touches[1].locationX) / 2;
            const focusY = (touches[0].locationY + touches[1].locationY) / 2;
          const worldX =
            WORLD_WIDTH / 2 +
            (focusX - canvasSize.width / 2 - start.transform.x) / start.transform.scale;
          const worldY =
            WORLD_HEIGHT / 2 +
            (focusY - canvasSize.height / 2 - start.transform.y) / start.transform.scale;
          const nextX =
            focusX -
            canvasSize.width / 2 -
            (worldX - WORLD_WIDTH / 2) * scale;
          const nextY =
            focusY -
            canvasSize.height / 2 -
            (worldY - WORLD_HEIGHT / 2) * scale;
          updateTransform({ x: nextX, y: nextY, scale });
            return;
          }
          updateTransform({
            scale: start.transform.scale,
            x: start.transform.x + gesture.dx,
            y: start.transform.y + gesture.dy,
          });
        },
      }),
    [canvasReady, canvasSize.height, canvasSize.width, graphBounds],
  );

  const changeScale = (amount: number) => {
    if (!canvasReady) return;
    const current = transformRef.current;
    const scale = clamp(current.scale + amount, MIN_SCALE, MAX_SCALE);
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
  const worldX =
    WORLD_WIDTH / 2 +
    (centerX - canvasSize.width / 2 - current.x) / current.scale;
  const worldY =
    WORLD_HEIGHT / 2 +
    (centerY - canvasSize.height / 2 - current.y) / current.scale;
  updateTransform({
    scale,
    x:
      centerX -
      canvasSize.width / 2 -
      (worldX - WORLD_WIDTH / 2) * scale,
    y:
      centerY -
      canvasSize.height / 2 -
      (worldY - WORLD_HEIGHT / 2) * scale,
  });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <SpaceAudio muted={muted} />
      <View {...panResponder.panHandlers} onLayout={handleCanvasLayout} style={styles.canvas}>
        {!canvasReady || moviesQuery.isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={GOLD} />
          </View>
        ) : watchedMovies.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons color={GOLD} name="sparkles-outline" size={28} />
            <Text style={styles.emptyTitle}>관람 기록이 아직 없음</Text>
            <Text style={styles.emptyCopy}>영화를 기록하면 이곳에 별이 생김</Text>
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
                  top: -WORLD_HEIGHT / 2,
                  transform: [{ scale: transform.scale }],
                },
              ]}
            >
            <Svg height={WORLD_HEIGHT} style={StyleSheet.absoluteFill} width={WORLD_WIDTH}>
              {graph.links.map((link) => (
                <Line
                  key={`${link.from.movie.movieId}-${link.to.movie.movieId}`}
                    opacity={0.52}
                  stroke={link.color}
                    strokeWidth={1.35}
                  x1={link.from.x}
                  x2={link.to.x}
                  y1={link.from.y}
                  y2={link.to.y}
                />
              ))}
            </Svg>
            {graph.stars.map((star) => (
              <Pressable
                accessibilityLabel={`${star.movie.title} 상세 보기`}
                disabled={transform.scale < 0.56}
                key={star.movie.movieId}
                onPress={() => setSelectedMovie(star.movie)}
                style={[
                  styles.starTouch,
                  { left: star.x - 42, top: star.y - 42 },
                ]}
              >
                <View style={[styles.starGlow, { width: star.size + 18, height: star.size + 18, borderRadius: 40 }]}>
                  <View style={[styles.star, { width: star.size, height: star.size, borderRadius: star.size }]} />
                </View>
                {transform.scale >= 0.56 ? <Text numberOfLines={1} style={styles.starLabel}>{star.movie.title}</Text> : null}
              </Pressable>
            ))}
            </View>
          </View>
        )}

        {canvasReady && watchedMovies.length > 0 ? (
          <View pointerEvents="box-none" style={styles.controls}>
            <View style={styles.zoomControl}>
              <Pressable accessibilityLabel="축소" hitSlop={8} onPress={() => changeScale(-0.14)} style={styles.zoomButton}>
                <Ionicons color={IVORY} name="remove" size={20} />
              </Pressable>
              <Text style={styles.zoomText}>{Math.round(transform.scale * 100)}%</Text>
              <Pressable accessibilityLabel="확대" hitSlop={8} onPress={() => changeScale(0.14)} style={styles.zoomButton}>
                <Ionicons color={IVORY} name="add" size={20} />
              </Pressable>
              <Pressable accessibilityLabel="전체 보기" hitSlop={8} onPress={resetUniverse} style={styles.zoomButton}>
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

      <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: SPACE },
  canvas: { flex: 1, overflow: "hidden", backgroundColor: CANVAS },
  worldAnchor: { position: "absolute", width: 1, height: 1 },
  world: { position: "absolute", width: WORLD_WIDTH, height: WORLD_HEIGHT },
  loadingState: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  emptyState: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 },
  emptyTitle: { marginTop: 12, color: IVORY, fontSize: 21, fontWeight: "700" },
  emptyCopy: { marginTop: 8, color: "#9aa5b6", fontSize: 14 },
  starTouch: { position: "absolute", width: 84, height: 84, alignItems: "center", justifyContent: "center" },
  starGlow: { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,196,113,0.08)", shadowColor: "#e6ca7d", shadowOpacity: 0.56, shadowRadius: 13, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  star: { backgroundColor: "#fff3cf", shadowColor: "#fff3cf", shadowOpacity: 0.9, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } },
  starLabel: { position: "absolute", top: 65, width: 148, textAlign: "center", color: "#e7e0d0", fontSize: 13, fontWeight: "600", textShadowColor: "rgba(0,0,0,0.9)", textShadowRadius: 4 },
  controls: { position: "absolute", right: 18, bottom: 18 },
  zoomControl: { flexDirection: "row", alignItems: "center", height: 42, paddingHorizontal: 4, borderRadius: 22, borderWidth: 1, borderColor: "rgba(226,231,242,0.2)", backgroundColor: "rgba(3,8,21,0.86)" },
  zoomButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  zoomText: { width: 48, color: "#d4d8df", fontSize: 12, textAlign: "center", fontVariant: ["tabular-nums"] },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(1,4,12,0.82)" },
  modalCard: { width: "100%", maxWidth: 360, alignItems: "center", borderRadius: 24, borderWidth: 1, borderColor: "rgba(220,191,112,0.55)", padding: 28, backgroundColor: "#09152b" },
  modalClose: { position: "absolute", top: 14, right: 14, width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  modalEyebrow: { color: GOLD, fontSize: 11, fontWeight: "700", letterSpacing: 2.6 },
  modalStar: { width: 30, height: 30, marginTop: 24, borderRadius: 15, backgroundColor: "#fff3cf", shadowColor: "#fff3cf", shadowOpacity: 0.95, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } },
  modalTitle: { marginTop: 18, color: IVORY, fontSize: 24, fontWeight: "800", textAlign: "center" },
  modalCopy: { marginTop: 10, color: "#aeb8c8", fontSize: 14, textAlign: "center" },
  detailButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 52, marginTop: 28, borderRadius: 16, backgroundColor: GOLD },
  detailButtonText: { color: SPACE, fontSize: 16, fontWeight: "800" },
});
