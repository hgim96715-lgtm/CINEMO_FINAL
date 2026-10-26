import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { CINEMO_COLORS } from "@cinemo/shared";
import { Redirect, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

import { BookmarkedPeopleList } from "@/components/my-cinema/BookmarkedPeopleList";
import { MovieCalendarView } from "@/components/my-cinema/MovieCalendarView";
import { MyPostcardsList } from "@/components/my-cinema/MyPostcardsList";
import { MovieRecordCalendar } from "@/components/movies/MovieRecordCalendar";
import { MovieViewingDetailsModal } from "@/components/movies/MovieViewingDetailsModal";
import { logoutMobile } from "@/lib/api/auth";
import type { MyMovie, MyMovieNotification } from "@/lib/api/my-cinema";
import type {
  UpdateMovieRecordInput,
  ViewingPlaceType,
  ViewingPlatform,
} from "@/lib/api/movie-records";
import {
  currentUserQueryOptions,
  myMovieNotificationsQueryOptions,
  myMoviesQueryOptions,
} from "@/lib/queries/my-cinema.query";
import { useUnsubscribeMyMovieNotification } from "@/lib/queries/my-cinema.mutation";
import {
  useDeleteMovieRecord,
  useUpdateMovieRecord,
} from "@/lib/queries/movie-record.mutation";
import { getImageUrl } from "@/lib/utils";

type Tab = "movies" | "people" | "notifications" | "postcards";
type MovieFilter = "watched" | "saved" | "calendar";

const viewingPlatformLabels: Record<string, string> = {
  NETFLIX: "Netflix",
  WATCHA: "왓챠",
  TVING: "티빙",
  DISNEY_PLUS: "Disney+",
  WAVVE: "웨이브",
  APPLE_TV: "Apple TV+",
  PRIME_VIDEO: "Prime Video",
  COUPANG_PLAY: "쿠팡플레이",
  TV: "TV",
};

const ratingOptions = Array.from({ length: 10 }, (_, index) =>
  ((index + 1) * 0.5).toFixed(1),
);

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

function formatMovieDate(date: string | null) {
  return date?.slice(0, 10).replaceAll("-", ".") ?? "-";
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
            {formatMovieDate(movie.watchedAt ?? movie.releaseDate)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function MovieRecordModal({
  movie,
  onClose,
  onEdit,
}: {
  movie: MyMovie | null;
  onClose: () => void;
  onEdit: (movie: MyMovie) => void;
}) {
  const posterUrl = movie ? getImageUrl(movie.posterUrl) : null;
  const isHomeViewing = movie?.viewingPlaceType === "HOME";
  const placeLabel = isHomeViewing
    ? movie?.viewingPlatform === "OTHER"
      ? movie.viewingPlatformCustom?.trim() || "기타 플랫폼"
      : movie?.viewingPlatform
        ? (viewingPlatformLabels[movie.viewingPlatform] ??
          movie.viewingPlatform)
        : "플랫폼 미선택"
    : movie?.viewingPlaceType === "VENUE"
      ? (movie.venue?.name ?? "다른 장소")
      : "-";
  const placeTitle = isHomeViewing ? "플랫폼" : "관람 장소";

  return (
    <Modal
      transparent
      visible={movie !== null}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: "rgba(0,0,0,0.68)" }}
        onPress={onClose}
      >
        <View
          onStartShouldSetResponder={() => true}
          className="max-h-[80%] w-full max-w-md overflow-hidden rounded-3xl border"
          style={{
            borderColor: "rgba(212,181,106,0.42)",
            backgroundColor: "#102022",
          }}
        >
          {movie && (
            <ScrollView>
              <View className="flex-row gap-4 px-6 pb-5 pt-7">
                <View
                  className="overflow-hidden rounded-xl"
                  style={{ width: 84, height: 126, backgroundColor: "#243235" }}
                >
                  {posterUrl ? (
                    <Image
                      source={{ uri: posterUrl }}
                      resizeMode="cover"
                      style={{ width: 84, height: 126 }}
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center px-2">
                      <Text className="text-center text-xs text-cinemo-muted">
                        포스터 없음
                      </Text>
                    </View>
                  )}
                </View>

                <View className="min-w-0 flex-1 justify-center">
                  <Text className="text-xl font-bold text-cinemo-text">
                    {movie.title}
                  </Text>
                  <Text className="mt-3 text-sm text-cinemo-muted">
                    {movie.watchedAt
                      ? `관람일 ${movie.watchedAt.slice(0, 10).replaceAll("-", ".")}`
                      : "관람일 미정"}
                  </Text>
                </View>
              </View>

              <View className="border-t border-white/10 px-6 py-5">
                <View className="gap-3">
                  <View className="flex-row justify-between gap-4">
                    <Text className="text-sm text-cinemo-gold-light">
                      {placeTitle}
                    </Text>
                    <Text className="flex-1 text-right text-sm text-cinemo-text">
                      {placeLabel}
                    </Text>
                  </View>
                  <View className="flex-row justify-between gap-4">
                    <Text className="text-sm text-cinemo-gold-light">평점</Text>
                    <Text className="text-sm text-cinemo-text">
                      {movie.rating ? `${movie.rating}점` : "-"}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row justify-end gap-3 border-t border-white/10 px-6 py-5">
                <Pressable
                  onPress={() => {
                    onClose();
                    onEdit(movie);
                  }}
                  className="rounded-xl border border-white/15 px-4 py-3"
                >
                  <Text className="text-sm font-semibold text-cinemo-muted">
                    관람 기록 수정
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    onClose();
                    router.push(`/movies/${movie.movieId}`);
                  }}
                  className="rounded-xl px-4 py-3"
                  style={{ backgroundColor: CINEMO_COLORS.accent }}
                >
                  <Text className="text-sm font-semibold text-cinemo-bg">
                    영화 상세 보기
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

function MovieRecordEditModal({
  movie,
  onClose,
}: {
  movie: MyMovie | null;
  onClose: () => void;
}) {
  const updateRecord = useUpdateMovieRecord(movie?.movieId ?? "");
  const deleteRecord = useDeleteMovieRecord(movie?.movieId ?? "");
  const [watchedDate, setWatchedDate] = useState(
    movie?.watchedAt?.slice(0, 10) ?? "",
  );
  const [rating, setRating] = useState<string | null>(movie?.rating ?? null);
  const [viewingPlaceType, setViewingPlaceType] =
    useState<ViewingPlaceType | null>(movie?.viewingPlaceType ?? null);
  const [viewingPlatform, setViewingPlatform] =
    useState<ViewingPlatform | null>(movie?.viewingPlatform ?? null);
  const [viewingPlatformCustom, setViewingPlatformCustom] = useState(
    movie?.viewingPlatformCustom ?? "",
  );
  const [venueName, setVenueName] = useState(movie?.venue?.name ?? "");
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [isViewingDetailsVisible, setIsViewingDetailsVisible] = useState(false);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);

  useEffect(() => {
    if (movie) {
      setWatchedDate(movie.watchedAt?.slice(0, 10) ?? "");
      setRating(movie.rating ?? null);
      setViewingPlaceType(movie.viewingPlaceType ?? null);
      setViewingPlatform(movie.viewingPlatform ?? null);
      setViewingPlatformCustom(movie.viewingPlatformCustom ?? "");
      setVenueName(movie.venue?.name ?? "");
    }
  }, [movie]);

  const viewingDetailsLabel =
    viewingPlaceType === "HOME"
      ? viewingPlatform === "OTHER"
        ? viewingPlatformCustom.trim() || "기타 플랫폼"
        : viewingPlatform
          ? viewingPlatformLabels[viewingPlatform] ?? viewingPlatform
          : "플랫폼 미선택"
      : viewingPlaceType === "VENUE"
        ? venueName || "극장"
        : "관람 정보 미등록";
  const viewingDetailsTitle =
    viewingPlaceType === "HOME" ? "플랫폼" : "관람 장소";

  const handleSave = () => {
    if (!movie) {
      return;
    }

    updateRecord.mutate(
      {
        isWatched: true,
        watchedAt: watchedDate || null,
        rating,
      },
      { onSuccess: onClose },
    );
  };

  const saveViewingDetails = (
    input: UpdateMovieRecordInput,
    venue?: { name: string },
  ) => {
    setIsViewingDetailsVisible(false);
    setViewingPlaceType(input.viewingPlaceType ?? null);
    setViewingPlatform(input.viewingPlatform ?? null);
    setViewingPlatformCustom(input.viewingPlatformCustom ?? "");
    setVenueName(
      venue?.name ?? (input.viewingPlaceType === "VENUE" ? "극장" : ""),
    );
    updateRecord.mutate(input);
  };

  const handleDelete = () => {
    if (!movie || deleteRecord.isPending) {
      return;
    }

    deleteRecord.mutate(undefined, {
      onSuccess: () => {
        setIsDeleteConfirmVisible(false);
        onClose();
      },
    });
  };

  return (
    <>
      <Modal
        transparent
        visible={
          movie !== null &&
          !isCalendarVisible &&
          !isViewingDetailsVisible &&
          !isDeleteConfirmVisible
        }
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.68)" }}
          onPress={onClose}
        >
          <View
            onStartShouldSetResponder={() => true}
            className="max-h-[88%] w-full max-w-md overflow-hidden rounded-3xl border"
            style={{
              borderColor: "rgba(212,181,106,0.42)",
              backgroundColor: "#102022",
            }}
          >
            {movie && (
              <ScrollView>
                <View className="flex-row items-start justify-between px-6 pb-5 pt-6">
                  <View className="flex-1 pr-4">
                    <Text className="text-xl font-bold text-cinemo-gold-light">
                      관람 기록 수정
                    </Text>
                    <Text className="mt-3 text-sm text-cinemo-muted">
                      {movie.title}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="관람 기록 수정 닫기"
                    onPress={onClose}
                    className="-mr-2 -mt-2 rounded-full p-2"
                  >
                    <Ionicons
                      name="close"
                      size={26}
                      color={CINEMO_COLORS.textSecondary}
                    />
                  </Pressable>
                </View>

                <View className="border-t border-white/10 px-6 py-5">
                  <Text className="mb-3 text-sm text-cinemo-muted">관람일</Text>
                  <Pressable
                    onPress={() => setIsCalendarVisible(true)}
                    className="rounded-xl border border-white/15 px-4 py-3"
                  >
                    <Text className="text-sm text-cinemo-text">
                      {watchedDate
                        ? watchedDate.replaceAll("-", ".")
                        : "관람일 선택"}
                    </Text>
                  </Pressable>

                  <Text className="mb-3 mt-5 text-sm text-cinemo-muted">
                    평점
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    <Pressable
                      onPress={() => setRating(null)}
                      className="rounded-xl border px-3 py-2.5"
                      style={{
                        borderColor:
                          rating === null
                            ? "rgba(212,181,106,0.7)"
                            : "rgba(255,255,255,0.15)",
                        backgroundColor:
                          rating === null
                            ? "rgba(212,181,106,0.18)"
                            : "rgba(255,255,255,0.05)",
                      }}
                    >
                      <Text className="text-sm text-cinemo-muted">없음</Text>
                    </Pressable>
                    {ratingOptions.map((value) => (
                      <Pressable
                        key={value}
                        onPress={() => setRating(value)}
                        className="rounded-xl border px-3 py-2.5"
                        style={{
                          borderColor:
                            rating === value
                              ? "rgba(212,181,106,0.7)"
                              : "rgba(255,255,255,0.15)",
                          backgroundColor:
                            rating === value
                              ? "rgba(212,181,106,0.18)"
                              : "rgba(255,255,255,0.05)",
                        }}
                      >
                        <Text className="text-sm text-cinemo-muted">
                          {value}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View className="mt-5">
                    <View className="flex-row items-center justify-between gap-4">
                      <Text className="text-sm text-cinemo-muted">
                        {viewingDetailsTitle}
                      </Text>
                      <Text className="flex-1 text-right text-sm text-cinemo-text">
                        {viewingDetailsLabel}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setIsViewingDetailsVisible(true)}
                      className="mt-3 rounded-xl border border-white/15 px-4 py-3"
                    >
                      <Text className="text-sm text-cinemo-muted">
                        관람 장소·플랫폼 변경
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View className="border-t border-white/10 px-6 py-5">
                  <Pressable
                    disabled={updateRecord.isPending || !watchedDate}
                    onPress={handleSave}
                    className="w-full items-center rounded-xl px-5 py-3.5"
                    style={{
                      backgroundColor: CINEMO_COLORS.accent,
                      opacity:
                        updateRecord.isPending || !watchedDate ? 0.45 : 1,
                    }}
                  >
                    <Text className="font-semibold text-cinemo-bg">
                      {updateRecord.isPending ? "저장 중..." : "변경사항 저장"}
                    </Text>
                  </Pressable>
                  <Pressable
                    disabled={deleteRecord.isPending}
                    onPress={() => setIsDeleteConfirmVisible(true)}
                    className="mt-3 w-full items-center rounded-xl border border-red-300/30 px-4 py-3.5"
                  >
                    <Text className="text-sm font-semibold text-red-200">
                      관람 기록 삭제
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </Pressable>
      </Modal>

      {movie && (
        <MovieRecordCalendar
          visible={isCalendarVisible}
          initialDate={watchedDate || new Date().toISOString().slice(0, 10)}
          onClose={() => setIsCalendarVisible(false)}
          onSelect={(date) => {
            setWatchedDate(date);
            setIsCalendarVisible(false);
          }}
        />
      )}

      {movie && (
        <MovieViewingDetailsModal
          visible={isViewingDetailsVisible}
          watchedDate={watchedDate}
          initialPlaceType={movie.viewingPlaceType}
          initialPlatform={movie.viewingPlatform}
          initialPlatformCustom={movie.viewingPlatformCustom}
          onClose={() => setIsViewingDetailsVisible(false)}
          onSave={saveViewingDetails}
        />
      )}

      <Modal
        transparent
        visible={isDeleteConfirmVisible}
        animationType="fade"
        onRequestClose={() => setIsDeleteConfirmVisible(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
          onPress={() => setIsDeleteConfirmVisible(false)}
        >
          <View
            onStartShouldSetResponder={() => true}
            className="w-full max-w-md overflow-hidden rounded-3xl border"
            style={{
              borderColor: "rgba(212,181,106,0.42)",
              backgroundColor: "#102022",
            }}
          >
            <View className="items-center px-6 pb-6 pt-7">
              <Text className="text-center text-xl font-bold text-cinemo-gold-light">
                관람 기록 삭제
              </Text>
              <Text className="mt-3 text-center text-sm text-cinemo-muted">
                {movie?.title}의 관람 기록을 삭제할까요?
              </Text>
            </View>
            <View className="flex-row justify-end gap-3 border-t border-white/10 px-6 py-5">
              <Pressable
                onPress={() => setIsDeleteConfirmVisible(false)}
                className="rounded-xl border border-white/15 px-5 py-3"
              >
                <Text className="font-semibold text-cinemo-muted">취소</Text>
              </Pressable>
              <Pressable
                disabled={deleteRecord.isPending}
                onPress={handleDelete}
                className="rounded-xl bg-red-500/80 px-5 py-3"
                style={{ opacity: deleteRecord.isPending ? 0.45 : 1 }}
              >
                <Text className="font-semibold text-white">
                  {deleteRecord.isPending ? "삭제 중..." : "삭제"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
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
  const [selectedMovie, setSelectedMovie] = useState<MyMovie | null>(null);
  const [editingMovie, setEditingMovie] = useState<MyMovie | null>(null);

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
      <Redirect
        href={{
          pathname: "/login",
          params: { from: "my-cinema" },
        }}
      />
    );
  }

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-cinemo-bg">
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
              ) : moviesQuery.isPending ? (
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
                    <MovieCard
                      key={movie.movieId}
                      movie={movie}
                      onPress={() => setSelectedMovie(movie)}
                    />
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
              <BookmarkedPeopleList />
            </View>
          )}

          {activeTab === "postcards" && (
            <View className="mt-5">
              <MyPostcardsList />
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

      <MovieRecordModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onEdit={(movie) => setEditingMovie(movie)}
      />

      <MovieRecordEditModal
        movie={editingMovie}
        onClose={() => setEditingMovie(null)}
      />
    </SafeAreaView>
  );
}
