import { MovieRankingCarousel } from "@/components/lobby/MovieRankingCarousel";
import { ReleasedMovieCarousel } from "@/components/lobby/ReleasedMovieCarousel";
import { UpcomingMovieCarousel } from "@/components/lobby/UpcomingMovieCarousel";
import { PostcardHeroCarousel } from "@/components/lobby/PostcardHeroCarousel";

export default function LobbyPage() {
  return (
    <main className="mx-auto w-full max-w-[120rem] px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 lg:px-10 lg:pb-24 lg:pt-10 ">
      <PostcardHeroCarousel />
      <MovieRankingCarousel />
      <UpcomingMovieCarousel />
      <ReleasedMovieCarousel />
    </main>
  );
}
