import { Ionicons } from "@expo/vector-icons";
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
          className="h-9 w-9"
        />
      </Pressable>

      <Pressable
        accessibilityLabel="영화 검색"
        className="h-11 w-11 items-center justify-center rounded-full"
        onPress={onSearchPress}
      >
        <Ionicons name="search-outline" size={26} />
      </Pressable>
    </View>
  );
}
