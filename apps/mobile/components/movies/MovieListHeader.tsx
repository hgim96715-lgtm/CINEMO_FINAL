import { CINEMO_COLORS } from "@cinemo/shared";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

export type MovieListFilterOption = {
  value: string;
  label: string;
};

type MovieListHeaderProps = {
  eyebrow: string;
  title: string;
  filter: string;
  options: MovieListFilterOption[];
  onFilterChange: (value: string) => void;
};

export function MovieListHeader({
  eyebrow,
  title,
  filter,
  options,
  onFilterChange,
}: MovieListHeaderProps) {
  return (
    <View>
      <Pressable
        className="mb-6 flex-row items-center gap-2 px-5"
        onPress={() => router.replace("/lobby")}
      >
        <ChevronLeft size={18} color={CINEMO_COLORS.textSecondary} />
        <Text
          className="text-sm"
          style={{ color: CINEMO_COLORS.textSecondary }}
        >
          로비로 돌아가기
        </Text>
      </Pressable>

      <View className="mb-6 px-5">
        <Text
          className="text-xs font-semibold tracking-[4px]"
          style={{ color: CINEMO_COLORS.accentLight }}
        >
          {eyebrow}
        </Text>

        <Text
          className="mt-2 text-3xl font-semibold"
          style={{ color: CINEMO_COLORS.textPrimary }}
        >
          {title}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 8,
          paddingHorizontal: 20,
          paddingBottom: 8,
        }}
      >
        {options.map((option) => {
          const isSelected = filter === option.value;

          return (
            <Pressable
              key={option.value}
              className="rounded-xl border px-4 py-2"
              style={{
                borderColor: isSelected
                  ? CINEMO_COLORS.accentLight
                  : "rgba(255, 255, 255, 0.2)",
                backgroundColor: isSelected
                  ? "rgba(212, 166, 76, 0.15)"
                  : "rgba(255, 255, 255, 0.05)",
              }}
              onPress={() => onFilterChange(option.value)}
            >
              <Text
                className="text-sm"
                style={{
                  color: isSelected
                    ? CINEMO_COLORS.accentLight
                    : CINEMO_COLORS.textSecondary,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
