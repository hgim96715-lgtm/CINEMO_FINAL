import { SafeAreaView } from "react-native-safe-area-context";
import { MovieRanking } from "@/components/lobby/MovieRanking";
import { UpcomingMovies } from "@/components/lobby/UpcomingMovies";
import { ReleasedMovies } from "@/components/lobby/ReleasedMovies";
import { Header } from "@/components/common/Header";
import { router } from "expo-router";
import { ScrollView } from "react-native";

export default function LobbyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cinemo-bg">
      <Header
        onSearchPress={() => {
          router.push("/search");
        }}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <MovieRanking />
        <UpcomingMovies />
        <ReleasedMovies />
      </ScrollView>
    </SafeAreaView>
  );
}
