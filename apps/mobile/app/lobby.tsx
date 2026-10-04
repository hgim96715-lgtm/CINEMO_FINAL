import { Header } from "@/components/common/Header";
import { MovieRanking } from "@/components/lobby/MovieRanking";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";
import { router } from "expo-router";

export default function LobbyScreen() {
  return (
    <SafeAreaView className="flex-1" style={{ flex: 1 }}>
      <Header
        onSearchPress={() => {
          router.push("/search");
        }}
      />

      <View className="flex-1" style={{ flex: 1 }}>
        <MovieRanking />
      </View>
      {/* <Footer /> */}
    </SafeAreaView>
  );
}
