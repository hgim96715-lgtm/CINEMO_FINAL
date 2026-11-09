import { LegalDocumentModal } from "@/components/auth/LegalDocumentModal";
import type { CinemoLegalDocument } from "@cinemo/shared";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CINEMO_COLORS } from "@cinemo/shared";
import { Redirect, router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BookmarkedPeopleList } from "@/components/my-cinema/BookmarkedPeopleList";
import { MyCinemaTabBar } from "@/components/my-cinema/MyCinemaTabBar";
import { MyMoviesSection } from "@/components/my-cinema/MyMoviesSection";
import { getMobileAccessToken } from "@/lib/api/apiClient";
import { useCinemoPermissions } from "@/components/my-cinema/DailyMovieWeatherSetting";
import { MyNotificationsSection } from "@/components/my-cinema/MyNotificationsSection";
import { ProfileEditor } from "@/components/my-cinema/ProfileEditor";
import { MyPostcardsList } from "@/components/my-cinema/MyPostcardsList";
import { MovieRecordCalendar } from "@/components/movies/MovieRecordCalendar";
import { MovieViewingDetailsModal } from "@/components/movies/MovieViewingDetailsModal";
import { deleteMobileAccount, logoutMobile } from "@/lib/api/auth";
import { getDailyMoviePreference, setDailyMoviePreference } from "@/lib/api/daily-movie";
import { registerDevicePushToken } from "@/lib/api/notifications";
import { getBlockedPostcardAuthors, unblockPostcardAuthor } from "@/lib/api/postcards";
import type { MyMovie } from "@/lib/api/my-cinema";
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

import type { MyCinemaTabKey } from "@/components/my-cinema/MyCinemaTabBar";

type Tab = MyCinemaTabKey;

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
          ? (viewingPlatformLabels[viewingPlatform] ?? viewingPlatform)
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
                    <Text className="text-base font-bold text-cinemo-gold-light">
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

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text accessibilityRole="header" className="px-1 text-xs font-semibold text-cinemo-muted">
        {title}
      </Text>
      <View className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-3">
        {children}
      </View>
    </View>
  );
}

function SettingsRow({
  icon, title, detail, danger, disabled, onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  detail?: string;
  danger?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const iconColor = danger ? "#f87171" : CINEMO_COLORS.accentLight;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className="min-h-14 flex-row items-center gap-3 rounded-xl px-1 py-3 active:bg-white/10"
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/5">
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className={danger ? "font-semibold text-red-400" : "font-semibold text-cinemo-text"}>
          {title}
        </Text>
        {detail && <Text className="text-xs text-cinemo-muted">{detail}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={CINEMO_COLORS.textSecondary} />
    </Pressable>
  );
}

export default function MyCinemaScreen() {
  const cinemaScrollRef = useRef<ScrollView>(null);
  const cinemaHeadingHeight = useRef(0);
  const cinemaTabsOffset = useRef(0);
  const [activeTab, setActiveTab] = useState<Tab>("movies");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<MyMovie | null>(null);
  const [editingMovie, setEditingMovie] = useState<MyMovie | null>(null);

  const userQuery = useQuery(currentUserQueryOptions());
  const [legalDocument, setLegalDocument] = useState<CinemoLegalDocument | null>(null);
  const openCinemoPermissions = useCinemoPermissions(userQuery.data?.id);
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

  const queryClient = useQueryClient();
  const dailyMoviePreferenceKey = ["daily-movie-preference", userQuery.data?.id];
  const dailyMoviePreference = useQuery({
    queryKey: dailyMoviePreferenceKey,
    queryFn: ({ signal }) => getDailyMoviePreference(signal),
    enabled: activeTab === "settings" && Boolean(userQuery.data),
    retry: false,
  });
  const updateDailyMoviePreference = useMutation({
    mutationFn: async (enabled: boolean) => {
      const token = enabled ? await registerDevicePushToken() : undefined;
      return setDailyMoviePreference(enabled, token?.id);
    },
    onSuccess: (preference) => queryClient.setQueryData(dailyMoviePreferenceKey, preference),
    onError: () => Alert.alert("추천 알림 설정 실패", "기기 알림 권한이나 네트워크 연결을 확인해 주세요."),
  });
  const blockedAuthors = useQuery({
    queryKey: ["postcards", "blocks"],
    queryFn: ({ signal }) => getBlockedPostcardAuthors(signal),
    enabled: activeTab === "settings" && Boolean(userQuery.data),
  });
  const unblockAuthor = useMutation({
    mutationFn: unblockPostcardAuthor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["postcards"] }),
    onError: () => Alert.alert("차단 해제 실패", "잠시 후 다시 시도해 주세요."),
  });
  const deleteAccount = useMutation({
    mutationFn: deleteMobileAccount,
    onSuccess: (deleted) => {
      if (!deleted) return;
      queryClient.clear();
      router.replace("/login");
    },
    onError: (error) => Alert.alert(
      "회원 탈퇴 실패",
      error instanceof Error && !("response" in error) ? error.message : "잠시 후 다시 시도해 주세요.",
    ),
  });

  const openSettingsLink = async (url: string | undefined, title: string) => {
    if (!url) {
      Alert.alert(title, "문서를 준비 중이에요. hello_cinemo@icloud.com으로 문의해 주세요.");
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(title, "열 수 없어요. hello_cinemo@icloud.com으로 문의해 주세요.");
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logoutMobile();
    } catch {
      Alert.alert("로그아웃", "기기의 로그인 정보 정리 중 오류가 발생했어요.");
    } finally {
      queryClient.clear();
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

  if (userQuery.isError && !userQuery.data && getMobileAccessToken()) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-cinemo-bg px-5">
        <Text className="text-cinemo-muted">내 시네마 정보를 불러오지 못했어요.</Text>
        <Pressable accessibilityRole="button" onPress={() => void userQuery.refetch()}>
          <Text className="font-semibold text-cinemo-gold-light">다시 시도</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!userQuery.data) {
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
        ref={cinemaScrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View
          className="px-5 pb-3 pt-3"
          onLayout={({ nativeEvent }) => { cinemaHeadingHeight.current = nativeEvent.layout.height; }}
        >
          <Text className="text-xs font-semibold tracking-[4px] text-cinemo-gold">
            MY CINEMA
          </Text>
          <Text className="mt-1 text-xl font-bold text-cinemo-text">
            나만의 영화 공간
          </Text>
        </View>

        <View className="px-5">
          <View
            className="rounded-2xl border p-3"
            style={{
              borderColor: "rgba(212,181,106,0.35)",
              backgroundColor: "#101f21",
            }}
          >
            <View className="flex-row items-center">
              <View
                className="items-center justify-center overflow-hidden rounded-full"
                style={{
                  width: 48,
                  height: 48,
                  borderWidth: 1,
                  borderColor: `${CINEMO_COLORS.accentLight}99`,
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
              >
                {userQuery.data.profileImageUrl ? (
                  <Image
                    source={{ uri: userQuery.data.profileImageUrl }}
                    resizeMode="cover"
                    style={{ width: 48, height: 48 }}
                  />
                ) : (
                  <Ionicons
                    name="person-outline"
                    size={23}
                    color={CINEMO_COLORS.textSecondary}
                  />
                )}
              </View>

              <View className="min-w-0 flex-1 px-3">
                <Text
                  numberOfLines={1}
                  className="text-base font-bold text-cinemo-text"
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
              <ProfileEditor user={userQuery.data} />
            </View>
          </View>

          <View className="mt-2 flex-row gap-2">
            {[
              ["saved", "저장한 영화", counts.saved],
              ["watched", "관람 기록", counts.watched],
              ["notifications", "개봉 알림", counts.notifications],
            ].map(([key, label, value]) => (
              <View
                key={key}
                className="flex-1 items-center rounded-xl border px-1 py-2"
                style={panelStyle}
              >
                <Text className="text-base font-bold text-cinemo-gold-light">
                  {value}
                </Text>
                <Text className="mt-1 text-center text-[11px] text-cinemo-muted">
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <View onLayout={({ nativeEvent }) => { cinemaTabsOffset.current = nativeEvent.layout.y; }}>
            <MyCinemaTabBar
              activeTab={activeTab}
              onChange={(tab) => {
                if (tab === activeTab) return;
                setActiveTab(tab);
                requestAnimationFrame(() => cinemaScrollRef.current?.scrollTo({
                  y: cinemaHeadingHeight.current + cinemaTabsOffset.current,
                  animated: true,
                }));
              }}
            />
          </View>

          {activeTab === "movies" && (
            <MyMoviesSection
              movies={movies}
              onSelectMovie={setSelectedMovie}
            />
          )}

          {activeTab === "notifications" && (
            <MyNotificationsSection
              notifications={notifications}
              isLoadingMovieId={
                unsubscribeMutation.isPending
                  ? unsubscribeMutation.variables
                  : undefined
              }
              onUnsubscribe={(movieId) => {
                unsubscribeMutation.mutate(movieId, {
                  onSuccess: () => {
                    setIsResultModalVisible(true);
                  },
                });
              }}
            />
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

          {activeTab === "settings" && (
            <View className="mt-6 gap-5">
              <SettingsGroup title="앱 설정">
                <SettingsRow icon="settings-outline" title="CINEMO 권한" detail="기기 설정에서 알림·위치·사진 권한 관리" onPress={() => void openCinemoPermissions()} />
              </SettingsGroup>

              <SettingsGroup title="영화 추천 알림">
                {dailyMoviePreference.data ? (
                  <View className="flex-row items-center gap-3 px-1 py-3">
                    <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                      <Ionicons name="sparkles-outline" size={18} color={CINEMO_COLORS.accentLight} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-cinemo-text">오늘의 영화 알림</Text>
                      <Text className="mt-1 text-xs text-cinemo-muted">앱을 열지 않은 날에 영화 한 편을 추천해요.</Text>
                    </View>
                    <Switch
                      accessibilityLabel="오늘의 영화 알림"
                      trackColor={{ true: CINEMO_COLORS.teal }}
                      value={dailyMoviePreference.data.enabled}
                      disabled={updateDailyMoviePreference.isPending}
                      onValueChange={(enabled) => updateDailyMoviePreference.mutate(enabled)}
                    />
                  </View>
                ) : (
                  <SettingsRow
                    icon="refresh-outline"
                    title={dailyMoviePreference.isError ? "추천 알림 설정 다시 불러오기" : "추천 알림 설정 불러오는 중"}
                    disabled={!dailyMoviePreference.isError}
                    onPress={() => void dailyMoviePreference.refetch()}
                  />
                )}
              </SettingsGroup>

              <SettingsGroup title="고객지원">
                <SettingsRow icon="mail-outline" title="문의하기" detail="hello_cinemo@icloud.com" onPress={() =>
                  void openSettingsLink("mailto:hello_cinemo@icloud.com", "고객센터 문의")
                } />
                <SettingsRow icon="document-text-outline" title="서비스 이용약관" onPress={() =>
                  setLegalDocument("service")
                } />
                <SettingsRow icon="shield-checkmark-outline" title="개인정보 처리방침" onPress={() =>
                  setLegalDocument("privacy")
                } />
              </SettingsGroup>

              <SettingsGroup title="차단한 작성자">
                {blockedAuthors.isPending && <Text className="px-1 py-3 text-cinemo-muted">불러오는 중…</Text>}
                {blockedAuthors.isError && (
                  <SettingsRow icon="refresh-outline" title="목록 다시 불러오기" onPress={() => void blockedAuthors.refetch()} />
                )}
                {blockedAuthors.data?.length === 0 && <Text className="px-1 py-3 text-cinemo-muted">차단한 작성자가 없어요.</Text>}
                {blockedAuthors.data?.map((author) => (
                  <SettingsRow
                    key={author.id}
                    icon="person-outline"
                    title={author.nickname}
                    detail="차단 해제"
                    disabled={unblockAuthor.isPending}
                    onPress={() => Alert.alert("차단 해제", `${author.nickname}님의 차단을 해제할까요?`, [
                      { text: "취소", style: "cancel" },
                      { text: "해제", onPress: () => unblockAuthor.mutate(author.id) },
                    ])}
                  />
                ))}
              </SettingsGroup>

              <SettingsGroup title="계정">
                <SettingsRow
                  icon="log-out-outline"
                  title={isLoggingOut ? "로그아웃 중" : "로그아웃"}
                  disabled={isLoggingOut || deleteAccount.isPending}
                  onPress={handleLogout}
                />
                <SettingsRow
                  icon="person-remove-outline"
                  title={deleteAccount.isPending ? "탈퇴 처리 중" : "회원 탈퇴"}
                  danger
                  disabled={deleteAccount.isPending || isLoggingOut}
                  onPress={() => Alert.alert(
                    "회원 탈퇴",
                    "계정을 삭제할까요? 삭제한 계정은 복구할 수 없어요.",
                    [
                      { text: "취소", style: "cancel" },
                      { text: "탈퇴", style: "destructive", onPress: () => deleteAccount.mutate() },
                    ],
                  )}
                />
              </SettingsGroup>
            </View>
          )}
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
      <LegalDocumentModal document={legalDocument} onClose={() => setLegalDocument(null)} />
    </SafeAreaView>
  );
}
