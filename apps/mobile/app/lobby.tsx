import { Header } from "@/components/common/Header";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MovieRanking } from "@/components/lobby/MovieRanking";
import { UpcomingMovies } from "@/components/lobby/UpcomingMovies";

export default function LobbyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cinemo-bg" style={{ flex: 1 }}>
      <Header
        onSearchPress={() => {
          router.push("/search");
        }}
      />
      <MovieRanking />
      <UpcomingMovies />
    </SafeAreaView>
  );
}
