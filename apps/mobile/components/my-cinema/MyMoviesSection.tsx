import { CachedImage as Image } from "@/components/common/CachedImage";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { CINEMO_COLORS } from "@cinemo/shared";
import type { MyMovie } from "@/lib/api/my-cinema";
import { MovieCalendarView } from "./MovieCalendarView";
import { getImageUrl } from "@/lib/utils";

type MovieFilter = "watched" | "saved" | "calendar";

type MyMoviesSectionProps = {
  movies: MyMovie[];
  onSelectMovie: (movie: MyMovie) => void;
};

export function MyMoviesSection({
  movies,
  onSelectMovie,
}: MyMoviesSectionProps) {
  const [movieFilter, setMovieFilter] = useState<MovieFilter>("watched");

  const visibleMovies =
    movieFilter === "saved"
      ? movies.filter((movie) => movie.isFavorite)
      : movies.filter((movie) => movie.isWatched);

  return (
    <View className="mt-5">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-cinemo-text">내 영화</Text>

        <View className="flex-row rounded-xl bg-white/5 p-1">
          {[
            ["watched", "관람"],
            ["saved", "저장"],
            ["calendar", "달력"],
          ].map(([key, label]) => {
            const isActive = movieFilter === key;

            return (
              <Pressable
                key={key}
                onPress={() => setMovieFilter(key as MovieFilter)}
                className="rounded-lg px-3 py-2"
                style={{
                  backgroundColor: isActive
                    ? "rgba(212,181,106,0.18)"
                    : "transparent",
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{
                    color: isActive
                      ? CINEMO_COLORS.accentLight
                      : CINEMO_COLORS.textSecondary,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {movieFilter === "calendar" ? (
        <MovieCalendarView />
      ) : visibleMovies.length === 0 ? (
        <View
          className="items-center rounded-2xl border p-8"
          style={panelStyle}
        >
          <Text className="text-center text-sm text-cinemo-muted">
            {movieFilter === "watched"
              ? "아직 관람 기록이 없음"
              : "저장한 영화가 없음"}
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {visibleMovies.map((movie) => (
            <MovieCard
              key={movie.movieId}
              movie={movie}
              onPress={() => onSelectMovie(movie)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function MovieCard({
  movie,
  onPress,
}: {
  movie: MyMovie;
  onPress: () => void;
}) {
  const posterUrl = getImageUrl(movie.posterUrl);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row rounded-2xl border p-3"
      style={panelStyle}
    >
      <View
        className="overflow-hidden rounded-xl"
        style={{ width: 72, height: 108, backgroundColor: "#243235" }}
      >
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            resizeMode="cover"
            style={{ width: 72, height: 108 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-2">
            <Text className="text-center text-[10px] text-cinemo-muted">
              포스터 없음
            </Text>
          </View>
        )}
      </View>

      <View className="min-w-0 flex-1 justify-center gap-2 pl-3">
        <View className="flex-row gap-2">
          <Text className="text-xs text-cinemo-gold">제목</Text>
          <Text
            numberOfLines={2}
            className="min-w-0 flex-1 text-sm font-semibold text-cinemo-text"
          >
            {movie.title}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Text className="text-xs text-cinemo-gold">날짜</Text>
          <Text className="text-xs text-cinemo-muted">
            {movie.watchedAt ? formatMovieDate(movie.watchedAt) : "관람일 미상"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function formatMovieDate(date: string | null) {
  return date?.slice(0, 10).replaceAll("-", ".") ?? "-";
}

const panelStyle = {
  borderColor: "rgba(255,255,255,0.1)",
  backgroundColor: "rgba(255,255,255,0.035)",
};
