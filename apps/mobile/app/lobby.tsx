import { SafeAreaView } from "react-native-safe-area-context";
import { MovieRanking } from "@/components/lobby/MovieRanking";
import { LobbyHeroTabs } from "@/components/lobby/LobbyHeroTabs";
import { ReleasedMovies } from "@/components/lobby/ReleasedMovies";
import { UpcomingMovies } from "@/components/lobby/UpcomingMovies";
import { PlatformMovies } from "@/components/lobby/PlatformMovies";
import { ScrollView } from "react-native";
import { CinemaMapButton } from "@/components/lobby/CinemaMapButton";
import { CommemorativeMovies } from "@/components/lobby/CommemorativeMovies";

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
        <CommemorativeMovies />
        <MovieRanking />
        <UpcomingMovies />
        <ReleasedMovies />
        <PlatformMovies />
      </ScrollView>
    </SafeAreaView>
  );
}
