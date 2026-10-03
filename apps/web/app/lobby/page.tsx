import { MovieHeroCarousel } from "@/components/lobby/MovieHeroCarousel";
import { MovieRankingCarousel } from "@/components/lobby/MovieRankingCarousel";

export default function LobbyPage() {
  return (
    <main className="mx-auto w-full max-w-[120rem] px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 lg:px-10 lg:pb-24 lg:pt-10 ">
      <MovieHeroCarousel />
      <MovieRankingCarousel />
    </main>
  );
}
