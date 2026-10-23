import { CINEMO_COLORS } from "@cinemo/shared";
import { Play } from "lucide-react-native";
import { Pressable } from "react-native";

type MovieTrailerButtonProps = {
  onPress: () => void;
};

export function MovieTrailerButton({
  onPress,
}: MovieTrailerButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="예고편 보기"
      className="flex-row items-center gap-2 self-start rounded-xl border px-4 py-3"
      style={{
        borderColor: "rgba(255,255,255,0.2)",
        backgroundColor: "rgba(255,255,255,0.05)",
      }}
      onPress={onPress}
    >
      <Play
        size={16}
        color={CINEMO_COLORS.accentLight}
        fill={CINEMO_COLORS.accentLight}
      />
    </Pressable>
  );
}
