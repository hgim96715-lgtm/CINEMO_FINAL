import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, usePathname } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Line,
  Path,
  Stop,
} from "react-native-svg";

import { CINEMO_COLORS } from "@cinemo/shared";
import type { MyMovie } from "@/lib/api/my-cinema";
import { myMoviesQueryOptions } from "@/lib/queries/my-cinema.query";

const spaceAmbient = require("@/assets/audio/space-ambient.mp3");

type ExpoAudioApi = typeof import("expo-audio");

let expoAudio: ExpoAudioApi | null = null;

try {
  expoAudio = require("expo-audio") as ExpoAudioApi;
} catch {
  // Expo Go나 이전 개발 빌드처럼 ExpoAudio가 없는 환경에서도 화면은 표시해야 함.
}

const SPACE = "#020711";
const FIELD = "#030a18";
const GOLD = CINEMO_COLORS.accentLight;
const IVORY = "#f8f2e8";

type StarNode = {
  movie: MyMovie;
  left: number;
  top: number;
  size: number;
};

type StarLink = {
  from: StarNode;
  to: StarNode;
  color: string;
};

const GENRE_COLORS = [GOLD, "#9fc8ef", "#efb7c8", "#b8d8b0"];

function normalizeGenre(genre: string) {
  return genre.trim().replace(/\s+/g, " ");
}

function linksCross(left: StarLink, right: StarLink) {
  const cross = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
  ) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);

  const leftSideA = cross(
    left.from.left,
    left.from.top,
    left.to.left,
    left.to.top,
    right.from.left,
    right.from.top,
  );
  const leftSideB = cross(
    left.from.left,
    left.from.top,
    left.to.left,
    left.to.top,
    right.to.left,
    right.to.top,
  );
  const rightSideA = cross(
    right.from.left,
    right.from.top,
    right.to.left,
    right.to.top,
    left.from.left,
    left.from.top,
  );
  const rightSideB = cross(
    right.from.left,
    right.from.top,
    right.to.left,
    right.to.top,
    left.to.left,
    left.to.top,
  );

  return leftSideA * leftSideB < 0 && rightSideA * rightSideB < 0;
}

function createStars(movies: MyMovie[]): StarNode[] {
  return movies.map((movie, index) => {
    const angle = index * 2.399963;
    const radius = 12 + (index % 10) * 6.5;

    return {
      movie,
      left: Math.max(4, Math.min(96, 50 + Math.cos(angle) * radius)),
      top: Math.max(8, Math.min(92, 44 + Math.sin(angle) * radius * 0.72)),
      size: movie.isFavorite ? 6 : 4,
    };
  });
}

/**
 * 화면에 배치된 실제 영화 별을 기준으로 같은 장르의 별을 연결함.
 * 추상적인 별자리 도형을 따로 그리지 않고 영화 1편이 별 1개가 되도록 유지함.
 */
function createStarMap(movies: MyMovie[]) {
  const stars = createStars(movies);
  const starsByMovieId = new Map(
    stars.map((star) => [star.movie.movieId, star]),
  );
  const grouped = new Map<string, MyMovie[]>();

  for (const movie of movies) {
    for (const rawGenre of movie.genres ?? []) {
      const genre = normalizeGenre(rawGenre);
      if (!genre) continue;
      grouped.set(genre, [...(grouped.get(genre) ?? []), movie]);
    }
  }

  const candidates: Array<StarLink & { distance: number; genreIndex: number }> = [];
  const maxLinkDistance = 20;

  Array.from(grouped.entries()).forEach(([, genreMovies], genreIndex) => {
    if (genreMovies.length < 3) return;

    const color = GENRE_COLORS[genreIndex % GENRE_COLORS.length];
    for (let fromIndex = 0; fromIndex < genreMovies.length; fromIndex += 1) {
      for (let toIndex = fromIndex + 1; toIndex < genreMovies.length; toIndex += 1) {
        const from = starsByMovieId.get(genreMovies[fromIndex].movieId);
        const to = starsByMovieId.get(genreMovies[toIndex].movieId);
        if (!from || !to) continue;

        const distance = Math.hypot(from.left - to.left, from.top - to.top);
        if (distance <= maxLinkDistance) {
          candidates.push({ from, to, color, distance, genreIndex });
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
  const links = new Map<string, StarLink>();

  for (const candidate of candidates) {
    const fromId = candidate.from.movie.movieId;
    const toId = candidate.to.movie.movieId;
    if ((degree.get(fromId) ?? 0) >= 2 || (degree.get(toId) ?? 0) >= 2) continue;

    const key = [fromId, toId].sort().join(":");
    if (links.has(key)) continue;

    const link = {
      from: candidate.from,
      to: candidate.to,
      color: candidate.color,
    } satisfies StarLink;
    if (Array.from(links.values()).some((existing) => linksCross(existing, link))) {
      continue;
    }

    links.set(key, link);
    degree.set(fromId, (degree.get(fromId) ?? 0) + 1);
    degree.set(toId, (degree.get(toId) ?? 0) + 1);
  }

  return { links: Array.from(links.values()), stars };
}

function SpaceAudio({ muted }: { muted: boolean }) {
  if (!expoAudio) return null;

  return <SpaceAudioPlayer audio={expoAudio} muted={muted} />;
}

function SpaceAudioPlayer({ audio, muted }: { audio: ExpoAudioApi; muted: boolean }) {
  const player = audio.useAudioPlayer(spaceAmbient, { updateInterval: 500 });
  const audioSessionReady = useRef(false);
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    let cancelled = false;

    const startAmbientSound = async () => {
      try {
        // iOS 무음 모드에서도 재생되도록 세션 설정을 먼저 완료해야 함.
        await audio.setAudioModeAsync({ playsInSilentMode: true });

        if (cancelled) return;

        player.loop = true;
        player.volume = 0.2;
        player.muted = mutedRef.current;

        if (!mutedRef.current) {
          player.play();
        }
        audioSessionReady.current = true;
      } catch (error) {
        audioSessionReady.current = false;
        console.warn("우주 소리 재생을 시작하지 못함", error);
      }
    };

    void startAmbientSound();

    return () => {
      cancelled = true;
      audioSessionReady.current = false;

      // 상세 페이지로 이동할 때 기존 네이티브 플레이어를 멈추지 않으면
      // 내 우주로 돌아왔을 때 이전 인스턴스와 새 인스턴스가 겹쳐 재생됨.
      // 이미 네이티브 객체가 해제된 경우 pause/muted가 예외를 던질 수 있어
      // 정리 단계에서는 안전하게 무시함.
      try {
        player.muted = true;
      } catch {
        // ExpoAudio가 이미 플레이어 객체를 해제한 경우
      }
      try {
        player.pause();
      } catch {
        // ExpoAudio가 이미 플레이어 객체를 해제한 경우
      }
      try {
        player.remove();
      } catch {
        // ExpoAudio가 이미 플레이어 객체를 해제한 경우
      }
    };
  }, [audio, player]);

  useEffect(() => {
    if (!audioSessionReady.current) return;

    try {
      player.muted = muted;
      if (muted) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      // 화면 전환이나 Fast Refresh 중 네이티브 플레이어가 먼저 폐기될 수 있음.
      // 이 경우 JS에서 다시 조작하지 않고 다음 마운트에서 새 플레이어를 만듦.
      audioSessionReady.current = false;
      console.warn("우주 소리 상태를 변경하지 못함", error);
    }
  }, [muted, player]);

  return null;
}

function Observer({ onInspect }: { onInspect: () => void }) {
  return (
    <View pointerEvents="box-none" style={styles.observerWrap}>
      <Svg
        accessibilityLabel="현미경으로 별을 관측하는 관찰자"
        height="100%"
        viewBox="0 0 360 220"
        width="100%"
      >
        <Defs>
          <LinearGradient id="body" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor="#263f66" />
            <Stop offset="1" stopColor="#0b1b34" />
          </LinearGradient>
          <LinearGradient id="metal" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor="#f1d58a" />
            <Stop offset="1" stopColor="#9f7738" />
          </LinearGradient>
        </Defs>
        <Ellipse cx="180" cy="207" fill="#01040b" opacity="0.82" rx="140" ry="6" />
        <Path d="M72 198c0-34 20-61 52-61s52 27 52 61Z" fill="url(#body)" stroke="#91a8c6" strokeOpacity="0.55" />
        <Circle cx="124" cy="101" fill="#263f66" r="38" stroke="#b5d3e8" strokeOpacity="0.8" strokeWidth="2" />
        <Path d="M90 102c3-20 16-31 34-31 17 0 30 11 34 30-16 12-51 13-68 1Z" fill="#07152b" stroke="#87a8d2" strokeOpacity="0.5" strokeWidth="2" />
        <Path d="M102 83c10-6 24-6 35 0" fill="none" stroke="#e2c886" strokeOpacity="0.6" strokeLinecap="round" strokeWidth="2" />
        <Circle cx="145" cy="95" fill="#f5d68f" r="4" />
        <Path d="M157 154c15-7 28-13 38-26" fill="none" stroke="#31547c" strokeLinecap="round" strokeWidth="11" />
        <Circle cx="195" cy="127" fill="#b5d3e8" r="7" stroke="#d5b36d" strokeWidth="2" />
        <Circle cx="124" cy="138" fill="#d5b36d" opacity="0.9" r="6" />
        <Path d="M174 198h124" stroke="url(#metal)" strokeLinecap="round" strokeWidth="10" />
        <Path d="M248 194V94" stroke="url(#metal)" strokeLinecap="round" strokeWidth="10" />
        <Path d="M248 101c-20 7-35 1-40-16-4-13 2-27 14-38" fill="none" stroke="url(#metal)" strokeLinecap="round" strokeWidth="11" />
        <Path d="m217 46 28-14" stroke="#f0d58c" strokeLinecap="round" strokeWidth="12" />
        <Path d="m208 45-10-9" stroke="#b58b45" strokeLinecap="round" strokeWidth="8" />
        <Path d="M245 91h-28" stroke="#d5b36d" strokeLinecap="round" strokeWidth="7" />
        <Circle cx="203" cy="93" fill="#0b1d35" r="12" stroke="#d5b36d" strokeWidth="3" />
        <Path d="M225 124h32M218 145h44" stroke="#91a7c5" strokeLinecap="round" strokeWidth="4" />
        <Circle cx="248" cy="198" fill="#f5d68f" r="6" />
      </Svg>
      <Pressable accessibilityLabel="현미경으로 별자리 보기" onPress={onInspect} style={styles.observerHitArea} />
    </View>
  );
}

function MicroscopeModal({
  movie,
  onClose,
  onMovieDetail,
  onNavigate,
}: {
  movie: MyMovie | null;
  onClose: () => void;
  onMovieDetail: () => void;
  onNavigate: (direction: -1 | 1) => void;
}) {
  const insets = useSafeAreaInsets();
  if (!movie) return null;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent>
      <View style={styles.modalBackdrop}>
        <SafeAreaView
          edges={[]}
          style={[
            styles.modalSafeArea,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              paddingTop: insets.top + 4,
            },
          ]}
        >
          <View style={styles.modalTopBar}>
            <Text style={styles.modalEyebrow}>THROUGH THE MICROSCOPE</Text>
            <Pressable accessibilityLabel="현미경 닫기" hitSlop={8} onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons color={IVORY} name="close" size={28} />
            </Pressable>
          </View>
          <Text style={styles.modalTitle}>영화의 별</Text>
          <Text style={styles.modalDescription}>밤하늘에 남은 하나의 빛</Text>
          <View style={styles.observationSpace}>
            <Svg height="100%" viewBox="0 0 390 320" width="100%">
              <Circle cx="18" cy="38" fill="#fff9df" opacity="0.65" r="1.4" />
              <Circle cx="62" cy="238" fill="#fff9df" opacity="0.42" r="1.2" />
              <Circle cx="184" cy="42" fill="#fff9df" opacity="0.5" r="1.2" />
              <Circle cx="229" cy="276" fill="#fff9df" opacity="0.56" r="1.5" />
              <Circle cx="354" cy="66" fill="#fff9df" opacity="0.45" r="1.2" />
              <Circle cx="370" cy="246" fill="#fff9df" opacity="0.6" r="1.3" />
              <Circle cx="195" cy="160" fill="#fff7d9" r="6" />
              <Circle cx="195" cy="160" fill="none" opacity="0.2" r="16" stroke="#fff7d9" strokeWidth="1" />
              <Circle cx="96" cy="88" fill="#b8d1ec" opacity="0.7" r="1.4" />
              <Circle cx="126" cy="226" fill="#b8d1ec" opacity="0.55" r="1.2" />
              <Circle cx="281" cy="92" fill="#b8d1ec" opacity="0.65" r="1.3" />
              <Circle cx="318" cy="214" fill="#b8d1ec" opacity="0.58" r="1.5" />
              <Circle cx="238" cy="54" fill="#fff9df" opacity="0.5" r="1.1" />
            </Svg>
            <View pointerEvents="none" style={styles.selectedMovieMeta}>
              <Text numberOfLines={1} style={styles.selectedMovieTitle}>{movie.title}</Text>
            </View>
            <Pressable
              accessibilityLabel="이전 영화"
              hitSlop={8}
              onPress={() => onNavigate(-1)}
              style={[styles.navArrow, styles.navArrowLeft]}
            >
              <Ionicons color={IVORY} name="arrow-back" size={22} />
            </Pressable>
            <Pressable
              accessibilityLabel="다음 영화"
              hitSlop={8}
              onPress={() => onNavigate(1)}
              style={[styles.navArrow, styles.navArrowRight]}
            >
              <Ionicons color={IVORY} name="arrow-forward" size={22} />
            </Pressable>
            <Pressable
              accessibilityLabel="이전 영화 위로 이동"
              hitSlop={8}
              onPress={() => onNavigate(-1)}
              style={[styles.navArrow, styles.navArrowUp]}
            >
              <Ionicons color={IVORY} name="arrow-up" size={22} />
            </Pressable>
            <Pressable
              accessibilityLabel="다음 영화 아래로 이동"
              hitSlop={8}
              onPress={() => onNavigate(1)}
              style={[styles.navArrow, styles.navArrowDown]}
            >
              <Ionicons color={IVORY} name="arrow-down" size={22} />
            </Pressable>
          </View>
          <Pressable
            accessibilityLabel={`${movie.title} 영화 상세 보기`}
            accessibilityRole="button"
            onPress={onMovieDetail}
            style={styles.detailButton}
          >
            <Text style={styles.detailButtonText}>영화 상세 보기</Text>
            <Ionicons color={SPACE} name="arrow-forward" size={20} style={{ marginLeft: 8 }} />
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Star({ node, onPress }: { node: StarNode; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`${node.movie.title} 영화 별 보기`}
      accessibilityRole="button"
      hitSlop={10}
      onPress={onPress}
      style={[
        styles.star,
        {
          backgroundColor: node.movie.isFavorite ? GOLD : "#fff9df",
          height: node.size,
          left: `${node.left}%`,
          shadowColor: GOLD,
          shadowOpacity: node.movie.isFavorite ? 0.75 : 0.38,
          shadowRadius: node.movie.isFavorite ? 8 : 4,
          top: `${node.top}%`,
          width: node.size,
        },
      ]}
    />
  );
}

export default function MyUniverseScreen() {
  const pathname = usePathname();
  const { height: viewportHeight, width: viewportWidth } = useWindowDimensions();
  const moviesQuery = useQuery(myMoviesQueryOptions());
  const movies = useMemo(
    () => (moviesQuery.data ?? []).filter((movie) => movie.isWatched),
    [moviesQuery.data],
  );
  const [selectedMovie, setSelectedMovie] = useState<MyMovie | null>(null);
  const [selectedMovieIndex, setSelectedMovieIndex] = useState(0);
  const [isSpaceSoundMuted, setIsSpaceSoundMuted] = useState(false);
  const horizontalScrollRef = useRef<ScrollView | null>(null);
  const verticalScrollRef = useRef<ScrollView | null>(null);
  const isUniverseRoute = pathname === "/my-universe";
  const universeScale = Math.max(
    1,
    Math.ceil(Math.sqrt(Math.max(movies.length, 1) / 8)),
  );
  const canvasWidth = Math.max(viewportWidth * 2.4, 1000 * universeScale);
  const canvasHeight = Math.max(viewportHeight * 1.7, 1200 * universeScale);
  const starMap = useMemo(() => createStarMap(movies), [movies]);
  const { links, stars } = starMap;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      horizontalScrollRef.current?.scrollTo({
        animated: false,
        x: Math.max(0, (canvasWidth - viewportWidth) / 2),
      });
      verticalScrollRef.current?.scrollTo({
        animated: false,
        y: Math.max(0, (canvasHeight - Math.max(viewportHeight - 68, 0)) / 2),
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [canvasHeight, canvasWidth, viewportHeight, viewportWidth]);

  const selectMovie = (movie: MyMovie, index: number) => {
    setSelectedMovie(movie);
    setSelectedMovieIndex(index);
  };

  const navigateMovie = (direction: -1 | 1) => {
    if (movies.length < 2) return;
    const nextIndex = (selectedMovieIndex + direction + movies.length) % movies.length;
    selectMovie(movies[nextIndex], nextIndex);
  };

  const openMovieDetail = () => {
    if (!selectedMovie) return;

    const movieId = selectedMovie.movieId;
    setSelectedMovie(null);
    setIsSpaceSoundMuted(true);
    router.push(`/movies/${movieId}`);
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.pageHeader}>
        <Pressable
          accessibilityLabel={isSpaceSoundMuted ? "우주 소리 켜기" : "우주 소리 음소거"}
          accessibilityRole="button"
          accessibilityState={{ checked: isSpaceSoundMuted }}
          hitSlop={8}
          onPress={() => setIsSpaceSoundMuted((muted) => !muted)}
          style={styles.soundButton}
        >
          <Ionicons
            color={GOLD}
            name={isSpaceSoundMuted ? "volume-mute-outline" : "volume-high-outline"}
            size={24}
          />
        </Pressable>
      </SafeAreaView>
      <SpaceAudio muted={isSpaceSoundMuted || !isUniverseRoute} />
      <View style={styles.universeViewport}>
        <ScrollView
          ref={horizontalScrollRef}
          bounces
          contentContainerStyle={{ width: canvasWidth }}
          directionalLockEnabled
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.universeHorizontalScroll}
        >
          <ScrollView
            ref={verticalScrollRef}
            bounces
            contentContainerStyle={{ height: canvasHeight }}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={{ width: canvasWidth }}
          >
            <View style={[styles.universeCanvas, { height: canvasHeight, width: canvasWidth }]}>
        <Svg pointerEvents="none" style={styles.planetLayer} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="ambientPlanetBlue" x1="0" x2="1" y1="0" y2="1">
              <Stop offset="0" stopColor="#6f9bd0" stopOpacity="0.2" />
              <Stop offset="1" stopColor="#172b51" stopOpacity="0.02" />
            </LinearGradient>
            <LinearGradient id="ambientPlanetGold" x1="0" x2="1" y1="0" y2="1">
              <Stop offset="0" stopColor="#d5b36d" stopOpacity="0.14" />
              <Stop offset="1" stopColor="#182b4b" stopOpacity="0.02" />
            </LinearGradient>
          </Defs>
          <Circle cx="8" cy="22" fill="url(#ambientPlanetBlue)" opacity="0.8" r="12" />
          <Ellipse
            cx="8"
            cy="22"
            fill="none"
            opacity="0.45"
            rx="17"
            ry="4"
            rotation="-18"
            stroke="#9fc8ef"
            strokeOpacity="0.16"
            strokeWidth="0.5"
          />
          <Circle cx="91" cy="54" fill="url(#ambientPlanetGold)" opacity="0.75" r="16" />
          <Ellipse
            cx="91"
            cy="54"
            fill="none"
            opacity="0.4"
            rx="22"
            ry="5"
            rotation="-18"
            stroke="#d5b36d"
            strokeOpacity="0.14"
            strokeWidth="0.5"
          />
        </Svg>
        <Svg
          pointerEvents="none"
          preserveAspectRatio="none"
          style={styles.connectionLayer}
          viewBox="0 0 100 100"
        >
          {links.map((link) => (
            <Line
              key={`${link.from.movie.movieId}-${link.to.movie.movieId}`}
              x1={link.from.left}
              y1={link.from.top}
              x2={link.to.left}
              y2={link.to.top}
              stroke={link.color}
              strokeOpacity={0.58}
              strokeWidth={0.28}
            />
          ))}
        </Svg>
        {stars.map((node) => {
          const movieIndex = movies.findIndex(
            ({ movieId }) => movieId === node.movie.movieId,
          );

          return (
            <Star
              key={node.movie.movieId}
              node={node}
              onPress={() => {
                if (movieIndex >= 0) selectMovie(node.movie, movieIndex);
              }}
            />
          );
        })}
        {moviesQuery.isPending && (
          <View style={styles.statusMessage}>
            <ActivityIndicator color={GOLD} />
            <Text style={styles.statusText}>우주를 불러오는 중...</Text>
          </View>
        )}
        {!moviesQuery.isPending && movies.length === 0 && (
          <View style={styles.statusMessage}>
            <Text style={styles.statusTitle}>아직 별이 없음</Text>
            <Text style={styles.statusText}>영화를 기록하면 작은 별이 생김</Text>
          </View>
        )}
            </View>
          </ScrollView>
        </ScrollView>
        <View pointerEvents="box-none" style={styles.observerOverlay}>
          <Observer onInspect={() => movies[0] && selectMovie(movies[0], 0)} />
        </View>
      </View>
      <MicroscopeModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onMovieDetail={openMovieDetail}
        onNavigate={navigateMovie}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: SPACE, flex: 1 },
  pageHeader: {
    alignItems: "flex-end",
    backgroundColor: "rgba(2,7,17,0.86)",
    flexDirection: "row",
    justifyContent: "flex-end",
    minHeight: 68,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  soundButton: {
    alignItems: "center",
    borderColor: "rgba(213,179,109,0.65)",
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  universeViewport: { backgroundColor: FIELD, flex: 1, overflow: "hidden", position: "relative" },
  universeHorizontalScroll: { flex: 1 },
  universeCanvas: { backgroundColor: FIELD, position: "relative" },
  observerOverlay: { ...StyleSheet.absoluteFill },
  planetLayer: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  connectionLayer: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  star: { borderRadius: 5, position: "absolute", shadowOffset: { height: 0, width: 0 } },
  observerWrap: { bottom: 2, height: 140, left: "50%", marginLeft: -120, position: "absolute", width: 240 },
  observerHitArea: { bottom: 28, height: 78, left: "52%", position: "absolute", width: 64 },
  statusMessage: { alignItems: "center", left: 0, position: "absolute", right: 0, top: "38%" },
  statusTitle: { color: IVORY, fontSize: 17, fontWeight: "700" },
  statusText: { color: "rgba(224,230,232,0.58)", fontSize: 12, marginTop: 8 },
  modalBackdrop: { backgroundColor: SPACE, flex: 1 },
  modalSafeArea: { alignItems: "center", flex: 1, paddingHorizontal: 12, paddingTop: 4 },
  modalTopBar: { alignItems: "center", alignSelf: "stretch", flexDirection: "row", justifyContent: "space-between", minHeight: 44 },
  modalCloseButton: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  modalEyebrow: { color: GOLD, fontSize: 9, fontWeight: "700", letterSpacing: 3.2 },
  modalTitle: { color: IVORY, fontSize: 30, fontWeight: "800", marginTop: 18, textAlign: "center" },
  modalDescription: { color: "rgba(224,230,232,0.62)", fontSize: 14, marginTop: 8 },
  observationSpace: { alignSelf: "stretch", flex: 1, marginTop: 18, minHeight: 240 },
  detailButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: GOLD,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    marginHorizontal: 12,
    marginTop: 10,
    minHeight: 52,
    paddingHorizontal: 18,
  },
  detailButtonText: { color: SPACE, fontSize: 16, fontWeight: "800" },
  selectedMovieMeta: {
    alignItems: "center",
    left: 24,
    position: "absolute",
    right: 24,
    top: "50%",
    transform: [{ translateY: 22 }],
  },
  selectedMovieTitle: { color: IVORY, fontSize: 21, fontWeight: "800", maxWidth: "90%" },
  navArrow: {
    alignItems: "center",
    backgroundColor: "rgba(2,7,17,0.46)",
    borderColor: "rgba(248,242,232,0.34)",
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    width: 40,
  },
  navArrowLeft: { left: 8, top: "50%", transform: [{ translateY: -20 }] },
  navArrowRight: { right: 8, top: "50%", transform: [{ translateY: -20 }] },
  navArrowUp: { left: "50%", top: 8, transform: [{ translateX: -20 }] },
  navArrowDown: { bottom: 8, left: "50%", transform: [{ translateX: -20 }] },
});
