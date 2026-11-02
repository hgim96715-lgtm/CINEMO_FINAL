import { SafeAreaView } from "react-native-safe-area-context";
import { MovieRanking } from "@/components/lobby/MovieRanking";
import { LobbyHeroTabs } from "@/components/lobby/LobbyHeroTabs";
import { ReleasedMovies } from "@/components/lobby/ReleasedMovies";
import { ScrollView } from "react-native";
import { CinemaMapButton } from "@/components/lobby/CinemaMapButton";

export default function LobbyScreen() {
  return (
    <SafeAreaView edges={[]} className="flex-1 bg-cinemo-bg">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <LobbyHeroTabs />
        <CinemaMapButton />
        <MovieRanking />
        <ReleasedMovies />
      </ScrollView>
    </SafeAreaView>
  );
}
