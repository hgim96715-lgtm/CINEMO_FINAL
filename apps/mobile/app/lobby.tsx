import { SafeAreaView } from "react-native-safe-area-context";
import { MovieRanking } from "@/components/lobby/MovieRanking";
import { PostcardHeroCarousel } from "@/components/lobby/PostcardHeroCarousel";
import { UpcomingMovies } from "@/components/lobby/UpcomingMovies";
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
        <PostcardHeroCarousel />
        <CinemaMapButton />
        <MovieRanking />
        <UpcomingMovies />
        <ReleasedMovies />
      </ScrollView>
    </SafeAreaView>
  );
}
