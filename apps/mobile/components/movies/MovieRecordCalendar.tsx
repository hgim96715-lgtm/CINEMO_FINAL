import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { CINEMO_COLORS } from "@cinemo/shared";

type Props = {
  visible: boolean;
  initialDate: string;
  onClose: () => void;
  onSelect: (date: string) => void;
};

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

function parseDateValue(value: string) {
  const normalizedValue = value.slice(0, 10);
  const [year, month, day] = normalizedValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayDate() {
  return formatDateValue(new Date());
}

function getMonthDays(month: Date) {
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

export function MovieRecordCalendar({
  visible,
  initialDate,
  onClose,
  onSelect,
}: Props) {
  const [month, setMonth] = useState(() => parseDateValue(initialDate));
  const today = getTodayDate();
  const monthDays = useMemo(() => getMonthDays(month), [month]);

  useEffect(() => {
    if (visible) {
      setMonth(parseDateValue(initialDate));
    }
  }, [initialDate, visible]);

  const moveMonth = (amount: number) => {
    setMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: "rgba(0,0,0,0.68)" }}
      >
        <View
          className="w-full max-w-md overflow-hidden rounded-3xl border"
          style={{
            borderColor: "rgba(212,181,106,0.42)",
            backgroundColor: "#102022",
          }}
        >
          <View className="px-6 pb-5 pt-7">
            <Text className="text-center text-xl font-bold text-cinemo-gold-light">
              언제 봤나요?
            </Text>
            <Text className="mt-3 text-center text-sm text-cinemo-muted">
              관람한 날짜를 선택하세요.
            </Text>
          </View>

          <View className="border-t border-white/10 px-5 pb-5 pt-4">
            <View className="flex-row items-center justify-between">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="이전 달"
                onPress={() => moveMonth(-1)}
                className="rounded-full p-2"
              >
                <ChevronLeft size={20} color={CINEMO_COLORS.textSecondary} />
              </Pressable>
              <Text className="text-base font-semibold text-white">
                {month.getFullYear()}년 {month.getMonth() + 1}월
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="다음 달"
                onPress={() => moveMonth(1)}
                className="rounded-full p-2"
              >
                <ChevronRight size={20} color={CINEMO_COLORS.textSecondary} />
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
              {monthDays.map((date, index) => {
                const dateValue = date ? formatDateValue(date) : null;
                const isSelected = dateValue === initialDate;
                const isFuture = dateValue ? dateValue > today : false;

                return (
                  <Pressable
                    key={dateValue ?? `empty-${index}`}
                    disabled={!date || isFuture}
                    onPress={() => dateValue && onSelect(dateValue)}
                    className="mb-2 w-[14.285%] items-center"
                  >
                    <View
                      className="h-10 w-10 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: isSelected
                          ? CINEMO_COLORS.accent
                          : "transparent",
                        opacity: isFuture ? 0.25 : 1,
                      }}
                    >
                      {date && (
                        <Text
                          className="text-sm"
                          style={{
                            color: isSelected
                              ? CINEMO_COLORS.background
                              : CINEMO_COLORS.textPrimary,
                          }}
                        >
                          {date.getDate()}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={onClose}
              className="mt-2 items-center rounded-xl border border-white/15 py-3"
            >
              <Text className="font-semibold text-cinemo-muted">닫기</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
