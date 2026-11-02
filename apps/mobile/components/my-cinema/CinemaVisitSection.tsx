import { Text, View } from "react-native";

import { CinemaVisitList } from "./CinemaVisitList";

export function CinemaVisitSection() {
  return (
    <View className="mt-5">
      <Text className="mb-4 text-lg font-bold text-cinemo-text">
        영화관 스탬프
      </Text>
      <CinemaVisitList />
    </View>
  );
}
