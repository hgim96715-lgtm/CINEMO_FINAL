import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { CINEMO_COLORS } from "@cinemo/shared";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Header } from "@/components/common/Header";
import { logoutMobile } from "@/lib/api/auth";
import type { MyMovie, MyMovieNotification } from "@/lib/api/my-cinema";
import {
  currentUserQueryOptions,
  myMovieNotificationsQueryOptions,
  myMoviesQueryOptions,
} from "@/lib/queries/my-cinema.query";
import { useUnsubscribeMyMovieNotification } from "@/lib/queries/my-cinema.mutation";
import { getImageUrl } from "@/lib/utils";

type Tab = "movies" | "people" | "notifications" | "postcards";
type MovieFilter = "watched" | "saved";

const panelStyle = {
  borderColor: "rgba(255,255,255,0.1)",
  backgroundColor: "rgba(255,255,255,0.035)",
};

function formatReleaseDate(releaseDate: string | null) {
  if (!releaseDate) {
    return "개봉일 미정";
  }

  return `개봉일 ${releaseDate.slice(0, 10).replaceAll("-", ".")}`;
}

function EmptyState({ message }: { message: string }) {
  return (
    <View className="items-center rounded-2xl border p-8" style={panelStyle}>
      <Ionicons
        name="film-outline"
        size={30}
        color={CINEMO_COLORS.textSecondary}
      />
      <Text className="mt-3 text-center text-sm text-cinemo-muted">
        {message}
      </Text>
    </View>
  );
}

function MovieCard({ movie }: { movie: MyMovie }) {
  const posterUrl = getImageUrl(movie.posterUrl);

  return (
    <Pressable
      onPress={() => router.push(`/movies/${movie.movieId}`)}
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

      <View className="min-w-0 flex-1 justify-center pl-3">
        <Text
          numberOfLines={2}
          className="text-base font-semibold text-cinemo-text"
        >
          {movie.title}
        </Text>

        {movie.isWatched && (
          <Text className="mt-2 text-xs text-cinemo-muted">관람 기록 있음</Text>
        )}

        {movie.rating && (
          <View className="mt-1 flex-row items-center gap-1">
            <Ionicons name="star" size={14} color={CINEMO_COLORS.accentLight} />
            <Text className="text-xs text-cinemo-gold-light">
              {movie.rating}
            </Text>
          </View>
        )}
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={CINEMO_COLORS.textSecondary}
      />
    </Pressable>
  );
}

function NotificationCard({
  notification,
  isLoading,
  onUnsubscribe,
}: {
  notification: MyMovieNotification;
  isLoading: boolean;
  onUnsubscribe: () => void;
}) {
  const title = notification.movie.titles[0]?.title ?? "제목 없음";
  const posterUrl = getImageUrl(notification.movie.media[0]?.url ?? null);
  const releaseDate = notification.release?.releaseDate ?? null;

  return (
    <View className="rounded-2xl border p-3" style={panelStyle}>
      <View className="flex-row items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title} 상세 보기`}
          onPress={() => router.push(`/movies/${notification.movieId}`)}
          className="min-w-0 flex-1 flex-row items-center"
        >
          <View
            className="overflow-hidden rounded-xl"
            style={{ width: 56, height: 84, backgroundColor: "#243235" }}
          >
            {posterUrl ? (
              <Image
                source={{ uri: posterUrl }}
                resizeMode="cover"
                style={{ width: 56, height: 84 }}
              />
            ) : (
              <View className="flex-1 items-center justify-center px-1">
                <Text className="text-center text-[10px] text-cinemo-muted">
                  포스터 없음
                </Text>
              </View>
            )}
          </View>

          <View className="min-w-0 flex-1 pl-3">
            <Text
              numberOfLines={2}
              className="text-base font-semibold text-cinemo-text"
            >
              {title}
            </Text>
            <Text className="mt-2 text-xs text-cinemo-gold-light">
              개봉 알림 신청 중
            </Text>
            <Text className="mt-1 text-xs text-cinemo-muted">
              {formatReleaseDate(releaseDate)}
            </Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title} 개봉 알림 해제`}
          disabled={isLoading}
          onPress={onUnsubscribe}
          className="ml-2 flex-row items-center gap-1 rounded-lg border px-2.5 py-2"
          style={{
            borderColor: "rgba(255,255,255,0.12)",
            backgroundColor: "rgba(255,255,255,0.05)",
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={CINEMO_COLORS.textSecondary}
            />
          ) : (
            <Ionicons
              name="notifications-off-outline"
              size={14}
              color={CINEMO_COLORS.textSecondary}
            />
          )}
          <Text className="text-[11px] font-semibold text-cinemo-muted">
            {isLoading ? "해제 중..." : "알림 해제"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function MyCinemaScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("movies");
  const [movieFilter, setMovieFilter] = useState<MovieFilter>("watched");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);

  const userQuery = useQuery(currentUserQueryOptions());
  const moviesQuery = useQuery(myMoviesQueryOptions(userQuery.isSuccess));
  const notificationsQuery = useQuery(
    myMovieNotificationsQueryOptions(userQuery.isSuccess),
  );
  const unsubscribeMutation = useUnsubscribeMyMovieNotification();

  const movies = moviesQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];

  const counts = useMemo(
    () => ({
      saved: movies.filter((movie) => movie.isFavorite).length,
      watched: movies.filter((movie) => movie.isWatched).length,
      notifications: notifications.length,
    }),
    [movies, notifications],
  );

  const visibleMovies = useMemo(
    () =>
      movieFilter === "saved"
        ? movies.filter((movie) => movie.isFavorite)
        : movies.filter((movie) => movie.isWatched),
    [movieFilter, movies],
  );

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logoutMobile();
    } finally {
      router.replace("/login");
    }
  };

  if (userQuery.isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-cinemo-bg">
        <ActivityIndicator color={CINEMO_COLORS.accentLight} />
      </SafeAreaView>
    );
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-cinemo-bg px-6">
        <Text className="text-center text-base text-cinemo-muted">
          로그인이 필요한 화면임
        </Text>
        <Pressable
          onPress={() => router.replace("/login")}
          className="mt-5 rounded-xl px-6 py-3"
          style={{ backgroundColor: CINEMO_COLORS.accentLight }}
        >
          <Text
            className="font-semibold"
            style={{ color: CINEMO_COLORS.background }}
          >
            로그인하기
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-cinemo-bg">
      <Header
        onSearchPress={() => {
          router.push("/search");
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-5 pb-6 pt-4">
          <Text className="text-xs font-semibold tracking-[4px] text-cinemo-gold">
            MY CINEMA
          </Text>
          <Text className="mt-2 text-2xl font-bold text-cinemo-text">
            나만의 영화 공간
          </Text>
        </View>

        <View className="px-5">
          <View
            className="rounded-3xl border p-5"
            style={{
              borderColor: "rgba(212,181,106,0.35)",
              backgroundColor: "#101f21",
            }}
          >
            <View className="flex-row items-center">
              <View
                className="items-center justify-center overflow-hidden rounded-full"
                style={{
                  width: 72,
                  height: 72,
                  borderWidth: 1,
                  borderColor: `${CINEMO_COLORS.accentLight}99`,
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
              >
                {userQuery.data.profileImageUrl ? (
                  <Image
                    source={{ uri: userQuery.data.profileImageUrl }}
                    resizeMode="cover"
                    style={{ width: 72, height: 72 }}
                  />
                ) : (
                  <Ionicons
                    name="person-outline"
                    size={30}
                    color={CINEMO_COLORS.textSecondary}
                  />
                )}
              </View>

              <View className="min-w-0 flex-1 pl-4">
                <Text className="text-xs font-semibold tracking-[2px] text-cinemo-gold-light">
                  CINEMO MEMBER
                </Text>
                <Text
                  numberOfLines={1}
                  className="mt-2 text-xl font-bold text-cinemo-text"
                >
                  {userQuery.data.nickname}의 영화 공간
                </Text>
                <Text
                  numberOfLines={1}
                  className="mt-1 text-sm text-cinemo-muted"
                >
                  {userQuery.data.email}
                </Text>
              </View>
            </View>

            <Text className="mt-5 border-t border-white/10 pt-4 text-sm leading-5 text-cinemo-muted">
              좋아하는 영화와 관람 기록을 나만의 시네마에 쌓아보세요.
            </Text>
          </View>

          <View className="mt-4 flex-row gap-3">
            {[
              ["saved", "저장한 영화", counts.saved],
              ["watched", "관람 기록", counts.watched],
              ["notifications", "개봉 알림", counts.notifications],
            ].map(([key, label, value]) => (
              <View
                key={key}
                className="flex-1 items-center rounded-2xl border px-2 py-4"
                style={panelStyle}
              >
                <Text className="text-xl font-bold text-cinemo-gold-light">
                  {value}
                </Text>
                <Text className="mt-1 text-center text-[11px] text-cinemo-muted">
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <View
            className="mt-6 flex-row rounded-2xl border p-1"
            style={panelStyle}
          >
            {[
              ["movies", "내 영화"],
              ["people", "저장한 인물"],
              ["notifications", "알림"],
              ["postcards", "내 엽서"],
            ].map(([key, label]) => {
              const isActive = activeTab === key;

              return (
                <Pressable
                  key={key}
                  onPress={() => setActiveTab(key as Tab)}
                  className="min-w-0 flex-1 items-center justify-center rounded-xl px-1 py-3"
                  style={{
                    backgroundColor: isActive
                      ? "rgba(255,255,255,0.1)"
                      : "transparent",
                  }}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                    className="text-center text-xs font-semibold"
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

          {activeTab === "movies" && (
            <View className="mt-5">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-lg font-bold text-cinemo-text">
                  내 영화
                </Text>

                <View className="flex-row rounded-xl bg-white/5 p-1">
                  {[
                    ["watched", "관람"],
                    ["saved", "저장"],
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

              {moviesQuery.isPending ? (
                <ActivityIndicator color={CINEMO_COLORS.accentLight} />
              ) : visibleMovies.length === 0 ? (
                <EmptyState
                  message={
                    movieFilter === "watched"
                      ? "아직 관람 기록이 없음"
                      : "저장한 영화가 없음"
                  }
                />
              ) : (
                <View className="gap-3">
                  {visibleMovies.map((movie) => (
                    <MovieCard key={movie.movieId} movie={movie} />
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === "notifications" && (
            <View className="mt-5">
              <Text className="mb-4 text-lg font-bold text-cinemo-text">
                개봉 알림
              </Text>

              {notificationsQuery.isPending ? (
                <ActivityIndicator color={CINEMO_COLORS.accentLight} />
              ) : notifications.length === 0 ? (
                <EmptyState message="신청한 개봉 알림이 없음" />
              ) : (
                <View className="gap-3">
                  {notifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      isLoading={
                        unsubscribeMutation.isPending &&
                        unsubscribeMutation.variables === notification.movieId
                      }
                      onUnsubscribe={() => {
                        unsubscribeMutation.mutate(notification.movieId, {
                          onSuccess: () => {
                            setIsResultModalVisible(true);
                          },
                        });
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === "people" && (
            <View className="mt-5">
              <EmptyState message="저장한 인물 화면 준비 중" />
            </View>
          )}

          {activeTab === "postcards" && (
            <View className="mt-5">
              <EmptyState message="내 엽서 화면 준비 중" />
            </View>
          )}

          <Pressable
            onPress={handleLogout}
            disabled={isLoggingOut}
            className="mt-8 items-center rounded-xl border py-4"
            style={{
              borderColor: "rgba(255,255,255,0.14)",
              backgroundColor: "rgba(255,255,255,0.06)",
              opacity: isLoggingOut ? 0.5 : 1,
            }}
          >
            {isLoggingOut ? (
              <ActivityIndicator color={CINEMO_COLORS.textSecondary} />
            ) : (
              <Text className="font-semibold text-cinemo-muted">로그아웃</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={isResultModalVisible}
        animationType="fade"
        onRequestClose={() => setIsResultModalVisible(false)}
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.62)" }}
        >
          <View
            className="w-full max-w-md overflow-hidden rounded-3xl"
            style={{
              backgroundColor: "rgba(16, 31, 33, 0.97)",
              borderColor: "rgba(212, 181, 106, 0.35)",
              borderWidth: 1,
              elevation: 12,
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 18,
            }}
          >
            <View className="items-center px-6 pb-6 pt-7">
              <Text
                className="text-center text-xl font-bold"
                style={{ color: CINEMO_COLORS.accentLight }}
              >
                개봉 알림을 해제했어요
              </Text>
              <Text
                className="mt-4 text-center text-base"
                style={{ color: CINEMO_COLORS.textSecondary }}
              >
                더 이상 개봉 알림을 보내지 않아요.
              </Text>
            </View>

            <View
              className="items-center border-t px-6 py-5"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              <Pressable
                className="min-w-24 items-center rounded-2xl px-7 py-3"
                style={{ backgroundColor: CINEMO_COLORS.accentLight }}
                onPress={() => setIsResultModalVisible(false)}
              >
                <Text
                  className="text-base font-bold"
                  style={{ color: CINEMO_COLORS.background }}
                >
                  확인
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
