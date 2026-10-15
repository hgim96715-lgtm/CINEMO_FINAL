import { Header } from "@/components/common/Header";
import { CinemoBackground } from "@/components/common/CinemoBackground";
import { MovieRanking } from "@/components/lobby/MovieRanking";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";
import { router } from "expo-router";

export default function LobbyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cinemo-bg" style={{ flex: 1 }}>
      <CinemoBackground />
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
