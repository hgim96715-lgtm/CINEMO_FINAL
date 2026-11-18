import { router } from "expo-router";
import { ArrowUpRight, HelpCircle, MapPin } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { CINEMO_COLORS } from "@cinemo/shared";

export function CinemaMapButton() {
  return (
    <View className="gap-3 px-5 pt-6">
      <Pressable
        onPress={() => router.push("/quizzes")}
        className="flex-row items-center justify-between rounded-2xl border border-cinemo-gold/25 bg-cinemo-gold/10 px-4 py-4"
      >
        <View className="flex-row items-center">
          <HelpCircle size={20} color={CINEMO_COLORS.accentLight} />
          <View className="ml-3">
            <Text className="font-semibold text-cinemo-text">랜덤 영화 퀴즈</Text>
            <Text className="mt-1 text-xs text-cinemo-muted">두 번의 기회로 영화 제목 맞히기</Text>
          </View>
        </View>
        <ArrowUpRight size={20} color={CINEMO_COLORS.accentLight} />
      </Pressable>
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
