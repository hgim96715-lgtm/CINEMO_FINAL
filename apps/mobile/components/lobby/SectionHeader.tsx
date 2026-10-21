import { CINEMO_COLORS } from "@cinemo/shared";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  morePath?: "/movies/upcoming" | "/movies/released";
};

export function SectionHeader({
  eyebrow,
  title,
  morePath,
}: SectionHeaderProps) {
  return (
    <View className="mb-5 flex-row items-center justify-between px-5">
      <View>
        <Text
          className="text-xs font-semibold tracking-[4px]"
          style={{ color: CINEMO_COLORS.accentLight }}
        >
          {eyebrow}
        </Text>

        <Text
          className="mt-2 text-2xl font-bold"
          style={{ color: CINEMO_COLORS.textPrimary }}
        >
          {title}
        </Text>
      </View>

      {morePath ? (
        <Pressable
          className="flex-row items-center gap-1"
          onPress={() => router.push(morePath)}
        >
          <Text
            className="text-sm"
            style={{ color: CINEMO_COLORS.textSecondary }}
          >
            더보기
          </Text>

          <ChevronRight size={16} color={CINEMO_COLORS.accentLight} />
        </Pressable>
      ) : null}
    </View>
  );
}
