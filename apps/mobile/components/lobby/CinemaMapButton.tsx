import { router } from "expo-router";
import { ArrowUpRight, MapPin } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { CINEMO_COLORS } from "@cinemo/shared";

export function CinemaMapButton() {
  return (
    <View className="px-5 pt-6">
      <Pressable
        onPress={() => router.push("/cinemas-map")}
        className="flex-row items-center justify-between rounded-2xl bg-cinemo-surface px-4 py-4"
      >
        <View className="flex-row items-center">
          <MapPin size={20} color={CINEMO_COLORS.accentLight} />

          <View className="ml-3">
            <Text className="font-semibold text-cinemo-text">
              전국 영화관 찾기
            </Text>

            <Text className="mt-1 text-xs text-cinemo-muted">
              지역별 영화관 위치와 개수 확인
            </Text>
          </View>
        </View>

        <ArrowUpRight size={20} color={CINEMO_COLORS.accentLight} />
      </Pressable>
    </View>
  );
}
