import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

import { CINEMO_COLORS } from "@cinemo/shared";
import type { MovieCalendarDay, MovieCalendarMovie } from "@/lib/api/my-cinema";
import { movieCalendarQueryOptions } from "@/lib/queries/movie-calendar.query";
import { getImageUrl } from "@/lib/utils";

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCalendarCells(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cells: Array<Date | null> = Array(firstDay.getDay()).fill(null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function CalendarMoviePoster({ movie }: { movie: MovieCalendarMovie }) {
  const posterUrl = getImageUrl(movie.posterUrl);

  return posterUrl ? (
    <Image
      source={{ uri: posterUrl }}
      resizeMode="cover"
      style={{ width: 28, height: 42, borderRadius: 4 }}
    />
  ) : (
    <View
      className="items-center justify-center rounded"
      style={{ width: 28, height: 42, backgroundColor: "rgba(255,255,255,0.1)" }}
    >
      <Ionicons name="film-outline" size={13} color={CINEMO_COLORS.textSecondary} />
    </View>
  );
}

function CalendarDayModal({
  day,
  onClose,
}: {
  day: MovieCalendarDay | null;
  onClose: () => void;
}) {
  return (
    <Modal
      transparent
      visible={day !== null}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.68)" }}
        onPress={onClose}
      >
        <View
          onStartShouldSetResponder={() => true}
          className="max-h-[75%] w-full overflow-hidden rounded-t-3xl border"
          style={{
            borderColor: "rgba(212,181,106,0.42)",
            backgroundColor: "#102022",
          }}
        >
          {day && (
            <>
              <View className="flex-row items-start justify-between px-6 pb-5 pt-6">
                <View className="flex-1 pr-4">
                  <Text className="text-xl font-bold text-cinemo-gold-light">
                    {day.date.replaceAll("-", ".")} 관람 영화
                  </Text>
                  <Text className="mt-3 text-sm text-cinemo-muted">
                    {day.movies.length}편의 영화 관람 기록이 있어요.
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="관람 영화 목록 닫기"
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

              <ScrollView
                className="border-t border-white/10 px-6 py-5"
                style={{ flexGrow: 0, maxHeight: 360 }}
                nestedScrollEnabled
              >
                <View className="flex-row flex-wrap gap-3">
                  {day.movies.map((movie) => (
                    <Pressable
                      key={movie.movieId}
                      onPress={() => {
                        onClose();
                        router.push(`/movies/${movie.movieId}`);
                      }}
                      className="w-[48%] flex-row items-center rounded-xl p-3"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    >
                      <CalendarMoviePoster movie={movie} />
                      <Text className="ml-3 flex-1 text-sm font-semibold text-cinemo-text">
                        {movie.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

            </>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

export function MovieCalendarView() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<MovieCalendarDay | null>(null);
  const today = new Date();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;
  const calendarQuery = useQuery(movieCalendarQueryOptions(year, month));
  const cells = useMemo(() => getCalendarCells(currentMonth), [currentMonth]);
  const daysByDate = useMemo(
    () => new Map((calendarQuery.data ?? []).map((day) => [day.date, day])),
    [calendarQuery.data],
  );

  const moveMonth = (amount: number) => {
    setCurrentMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
  };

  const isCurrentMonth =
    currentMonth.getFullYear() === today.getFullYear() &&
    currentMonth.getMonth() === today.getMonth();

  return (
    <>
      <View className="rounded-2xl border p-4" style={panelStyle}>
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전 달"
            onPress={() => moveMonth(-1)}
            className="rounded-full p-2"
          >
            <Ionicons name="chevron-back" size={20} color={CINEMO_COLORS.accentLight} />
          </Pressable>
          <Text className="text-base font-semibold text-cinemo-text">
            {year}년 {month}월
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="다음 달"
            disabled={isCurrentMonth}
            onPress={() => moveMonth(1)}
            className="rounded-full p-2"
            style={{ opacity: isCurrentMonth ? 0.3 : 1 }}
          >
            <Ionicons name="chevron-forward" size={20} color={CINEMO_COLORS.accentLight} />
          </Pressable>
        </View>

        <View className="mt-4 flex-row">
          {weekDays.map((day, index) => (
            <Text
              key={day}
              className="flex-1 text-center text-xs font-semibold"
              style={{
                color:
                  index === 0
                    ? "#e28b8b"
                    : index === 6
                      ? "#8eafd8"
                      : CINEMO_COLORS.textSecondary,
              }}
            >
              {day}
            </Text>
          ))}
        </View>

        <View className="mt-3 flex-row flex-wrap">
          {cells.map((date, index) => {
            const dateKey = date ? formatDate(date) : null;
            const calendarDay = dateKey ? daysByDate.get(dateKey) : undefined;
            const isToday = dateKey === formatDate(today);

            return (
              <Pressable
                key={dateKey ?? `empty-${index}`}
                disabled={!calendarDay}
                onPress={() => calendarDay && setSelectedDay(calendarDay)}
                className="mb-3 w-[14.285%] items-center"
              >
                <View
                  className="h-9 w-9 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: isToday
                      ? "rgba(212,181,106,0.18)"
                      : "transparent",
                  }}
                >
                  {date && (
                    <Text
                      className="text-xs"
                      style={{
                        color: isToday
                          ? CINEMO_COLORS.accentLight
                          : CINEMO_COLORS.textPrimary,
                      }}
                    >
                      {date.getDate()}
                    </Text>
                  )}
                </View>
                {calendarDay && (
                  <View className="mt-1 items-center">
                    <CalendarMoviePoster movie={calendarDay.movies[0]} />
                    {calendarDay.movies.length > 1 && (
                      <Text className="mt-0.5 text-[9px] text-cinemo-gold-light">
                        +{calendarDay.movies.length - 1}
                      </Text>
                    )}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {calendarQuery.isPending && (
          <Text className="mt-2 text-center text-xs text-cinemo-muted">
            관람 기록을 불러오는 중...
          </Text>
        )}
      </View>

      <CalendarDayModal
        day={selectedDay}
        onClose={() => setSelectedDay(null)}
      />
    </>
  );
}

const panelStyle = {
  borderColor: "rgba(255,255,255,0.1)",
  backgroundColor: "rgba(255,255,255,0.035)",
};
