import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  CalendarDays,
  Eye,
  EyeClosed,
  Heart,
  Mail,
  Star,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { CINEMO_COLORS } from "@cinemo/shared";
import { getRefreshToken } from "@/lib/api/auth";
import { movieRecordQueryOptions } from "@/lib/queries/movie-record.query";
import { useUpdateMovieRecord } from "@/lib/queries/movie-record.mutation";
import { MovieRecordCalendar } from "./MovieRecordCalendar";
import { MovieViewingDetailsModal } from "./MovieViewingDetailsModal";

type Props = {
  movieId: string;
  openEdit?: boolean;
};

const ratingOptions = Array.from({ length: 10 }, (_, index) =>
  ((index + 1) * 0.5).toFixed(1),
);

function getTodayDate() {
  const today = new Date();
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 10);
}

function getDateValue(value: string | null | undefined) {
  const normalizedValue = value?.slice(0, 10);

  return normalizedValue && /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)
    ? normalizedValue
    : getTodayDate();
}

export function MovieRecordActions({ movieId, openEdit = false }: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [isViewingDetailsVisible, setIsViewingDetailsVisible] = useState(false);
  const [watchedDate, setWatchedDate] = useState(getTodayDate);
  const [isEditingWatchedDate, setIsEditingWatchedDate] = useState(false);
  const hasOpenedEditRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function loadAuthState() {
      try {
        const refreshToken = await getRefreshToken();

        if (mounted) {
          setIsLoggedIn(Boolean(refreshToken));
        }
      } catch {
        if (mounted) {
          setIsLoggedIn(false);
        }
      }
    }

    void loadAuthState();

    return () => {
      mounted = false;
    };
  }, []);

  const recordQuery = useQuery(
    movieRecordQueryOptions(movieId, isLoggedIn === true),
  );
  const updateRecord = useUpdateMovieRecord(movieId);
  const record = recordQuery.data;
  const isDisabled = isLoggedIn === null || updateRecord.isPending;
  const selectedRating = record?.rating
    ? Number(record.rating).toFixed(1)
    : null;

  useEffect(() => {
    if (!openEdit || !record || hasOpenedEditRef.current) {
      return;
    }

    hasOpenedEditRef.current = true;
    setIsEditingWatchedDate(Boolean(record.isWatched));
    setWatchedDate(getDateValue(record.watchedAt));
    setIsCalendarVisible(true);
  }, [openEdit, record]);

  const requireLogin = () => {
    setIsLoginModalVisible(true);
  };

  const toggleFavorite = () => {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }

    updateRecord.mutate({ isFavorite: !(record?.isFavorite ?? false) });
  };

  const openWatchedCalendar = (editDate: boolean) => {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }

    setIsEditingWatchedDate(editDate);
    setWatchedDate(getDateValue(record?.watchedAt));
    setIsCalendarVisible(true);
  };

  const toggleWatched = () => {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }

    if (record?.isWatched) {
      updateRecord.mutate({
        isWatched: false,
        watchedAt: null,
        venueId: null,
        viewingPlaceType: null,
        viewingPlatform: null,
        viewingPlatformCustom: null,
      });
      return;
    }

    openWatchedCalendar(false);
  };

  const selectWatchedDate = (date: string) => {
    setWatchedDate(date);
    setIsCalendarVisible(false);

    if (isEditingWatchedDate) {
      updateRecord.mutate({ isWatched: true, watchedAt: date });
      return;
    }

    setIsViewingDetailsVisible(true);
  };

  const saveViewingDetails = (input: Parameters<typeof updateRecord.mutate>[0]) => {
    setIsViewingDetailsVisible(false);
    updateRecord.mutate(input);
  };

  const selectRating = (rating: string | null) => {
    setIsRatingModalVisible(false);
    updateRecord.mutate({ rating });
  };

  const openRatingModal = () => {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }

    setIsRatingModalVisible(true);
  };

  return (
    <>
      <View className="flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={record?.isFavorite ? "찜하기 해제" : "찜하기"}
          accessibilityState={{ selected: record?.isFavorite }}
          disabled={isDisabled}
          onPress={toggleFavorite}
          className="min-w-0 flex-1 items-center justify-center rounded-xl border py-3"
          style={{
            borderColor: record?.isFavorite
              ? "rgba(212,181,106,0.6)"
              : "rgba(255,255,255,0.2)",
            backgroundColor: record?.isFavorite
              ? "rgba(212,181,106,0.15)"
              : "rgba(255,255,255,0.05)",
            opacity: isDisabled ? 0.5 : 1,
          }}
        >
          <Heart
            size={18}
            color={
              record?.isFavorite
                ? CINEMO_COLORS.accentLight
                : CINEMO_COLORS.textSecondary
            }
            fill={record?.isFavorite ? CINEMO_COLORS.accentLight : "none"}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={record?.isWatched ? "봤어요 해제" : "봤어요"}
          accessibilityState={{ selected: record?.isWatched }}
          disabled={isDisabled}
          onPress={toggleWatched}
          className="min-w-0 flex-1 items-center justify-center rounded-xl border py-3"
          style={{
            borderColor: record?.isWatched
              ? "rgba(212,181,106,0.6)"
              : "rgba(255,255,255,0.2)",
            backgroundColor: record?.isWatched
              ? "rgba(212,181,106,0.15)"
              : "rgba(255,255,255,0.05)",
            opacity: isDisabled ? 0.5 : 1,
          }}
        >
          {record?.isWatched ? (
            <Eye size={18} color={CINEMO_COLORS.accentLight} />
          ) : (
            <EyeClosed size={18} color={CINEMO_COLORS.textSecondary} />
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="관람일 수정"
          disabled={isDisabled || !record?.isWatched}
          onPress={() => openWatchedCalendar(true)}
          className="min-w-0 flex-1 items-center justify-center rounded-xl border py-3"
          style={{
            borderColor: record?.isWatched
              ? "rgba(212,181,106,0.6)"
              : "rgba(255,255,255,0.1)",
            backgroundColor: record?.isWatched
              ? "rgba(212,181,106,0.15)"
              : "rgba(255,255,255,0.03)",
            opacity: isDisabled || !record?.isWatched ? 0.45 : 1,
          }}
        >
          <CalendarDays
            size={18}
            color={
              record?.isWatched
                ? CINEMO_COLORS.accentLight
                : CINEMO_COLORS.textSecondary
            }
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="평점 선택"
          disabled={isDisabled}
          onPress={openRatingModal}
          className="min-w-0 flex-1 items-center justify-center rounded-xl border py-3"
          style={{
            borderColor: selectedRating
              ? "rgba(212,181,106,0.6)"
              : "rgba(255,255,255,0.2)",
            backgroundColor: selectedRating
              ? "rgba(212,181,106,0.15)"
              : "rgba(255,255,255,0.05)",
            opacity: isDisabled ? 0.5 : 1,
          }}
        >
          <Star
            size={18}
            color={
              selectedRating
                ? CINEMO_COLORS.accentLight
                : CINEMO_COLORS.textSecondary
            }
            fill={selectedRating ? CINEMO_COLORS.accentLight : "none"}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="엽서 만들기"
          onPress={() => {
            if (!isLoggedIn) {
              requireLogin();
              return;
            }

            router.push(`/postcards/new?movieId=${encodeURIComponent(movieId)}`);
          }}
          className="min-w-0 flex-1 items-center justify-center rounded-xl border py-3"
          style={{
            borderColor: "rgba(212,181,106,0.45)",
            backgroundColor: "rgba(212,181,106,0.1)",
            opacity: isLoggedIn === null ? 0.5 : 1,
          }}
        >
          <Mail size={18} color={CINEMO_COLORS.accentLight} />
        </Pressable>
      </View>

      <Modal
        transparent
        visible={isLoginModalVisible}
        animationType="fade"
        onRequestClose={() => setIsLoginModalVisible(false)}
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.62)" }}
        >
          <View
            className="w-full max-w-md overflow-hidden rounded-3xl border"
            style={{
              borderColor: "rgba(212,181,106,0.35)",
              backgroundColor: "rgba(16,31,33,0.97)",
            }}
          >
            <View className="items-center px-6 pb-6 pt-7">
              <Text className="text-xl font-bold text-cinemo-gold-light">
                로그인이 필요합니다
              </Text>
              <Text className="mt-4 text-center text-base text-cinemo-muted">
                찜하기·봤어요·평점은 로그인 후 저장할 수 있어요.
              </Text>
            </View>
            <View className="flex-row justify-center gap-3 border-t border-white/10 px-6 py-5">
              <Pressable
                className="rounded-xl border border-white/15 px-5 py-3"
                onPress={() => setIsLoginModalVisible(false)}
              >
                <Text className="font-semibold text-cinemo-muted">닫기</Text>
              </Pressable>
              <Pressable
                className="rounded-xl bg-cinemo-gold px-5 py-3"
                onPress={() => {
                  setIsLoginModalVisible(false);
                  router.push("/login");
                }}
              >
                <Text className="font-semibold text-cinemo-bg">
                  로그인하기
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={isRatingModalVisible}
        animationType="fade"
        onRequestClose={() => setIsRatingModalVisible(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.62)" }}
          onPress={() => setIsRatingModalVisible(false)}
        >
          <View
            onStartShouldSetResponder={() => true}
            className="w-full max-w-sm overflow-hidden rounded-3xl border"
            style={{
              borderColor: "rgba(212,181,106,0.35)",
              backgroundColor: "rgba(16,31,33,0.97)",
            }}
          >
            <View className="px-6 pb-5 pt-7">
              <Text className="text-center text-xl font-bold text-cinemo-gold-light">
                평점 선택
              </Text>
              <Text className="mt-3 text-center text-sm text-cinemo-muted">
                이 영화에 대한 평점을 선택하세요.
              </Text>
            </View>

            <View className="border-t border-white/10 px-6 py-5">
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => selectRating(null)}
                  className="w-full rounded-xl px-3 py-3"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  <Text className="text-center text-sm text-cinemo-muted">
                    평점 없음
                  </Text>
                </Pressable>

                {ratingOptions.map((rating) => {
                  const selected = selectedRating === rating;

                  return (
                    <Pressable
                      key={rating}
                      onPress={() => selectRating(rating)}
                      className="w-[18%] items-center rounded-xl px-2 py-3"
                      style={{
                        backgroundColor: selected
                          ? "rgba(212,181,106,0.2)"
                          : "rgba(255,255,255,0.05)",
                      }}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{
                          color: selected
                            ? CINEMO_COLORS.accentLight
                            : CINEMO_COLORS.textSecondary,
                        }}
                      >
                        {rating}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>

      <MovieRecordCalendar
        visible={isCalendarVisible}
        initialDate={watchedDate}
        onClose={() => setIsCalendarVisible(false)}
        onSelect={selectWatchedDate}
      />

      <MovieViewingDetailsModal
        key={isViewingDetailsVisible ? `${watchedDate}-open` : "closed"}
        visible={isViewingDetailsVisible}
        watchedDate={watchedDate}
        initialPlaceType={record?.viewingPlaceType ?? null}
        initialPlatform={record?.viewingPlatform ?? null}
        initialPlatformCustom={record?.viewingPlatformCustom ?? null}
        onClose={() => setIsViewingDetailsVisible(false)}
        onSave={saveViewingDetails}
      />
    </>
  );
}
