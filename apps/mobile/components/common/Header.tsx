import { Ionicons } from "@expo/vector-icons";
import { CINEMO_COLORS } from "@cinemo/shared";
import { router } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";

type HeaderProps = {
  onSearchPress?: () => void;
};

export function Header({ onSearchPress }: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5 py-4">
      <Pressable
        className="flex-col items-center"
        onPress={() => router.replace("/lobby")}
      >
        <Image
          source={require("../../assets/icon.png")}
          resizeMode="contain"
          style={{ width: 36, height: 36 }}
          className="h-9 w-9"
        />
      </Pressable>

      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="영화 검색"
          className="h-11 w-11 items-center justify-center rounded-full"
          onPress={onSearchPress}
        >
          <Ionicons
            name="search-outline"
            size={26}
            color={CINEMO_COLORS.accentLight}
            style={{ fontSize: 26 }}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="로그인"
          className="rounded-full px-3 py-2"
          onPress={() => router.push("/login")}
        >
          <Text
            className="text-sm text-cinemo-muted"
            style={{ color: CINEMO_COLORS.textSecondary }}
          >
            로그인
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
