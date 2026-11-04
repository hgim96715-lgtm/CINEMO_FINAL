import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clapperboard, Sparkles, Tv } from "lucide-react";

const movieLists = [
  {
    href: "/lobby/movies/upcoming",
    eyebrow: "COMING SOON",
    title: "개봉 예정작",
    description: "곧 극장에서 만날 영화를 미리 살펴보기",
    icon: CalendarDays,
  },
  {
    href: "/lobby/movies/released",
    eyebrow: "THIS YEAR",
    title: "올해 개봉·공개한 영화",
    description: "올해 새롭게 만난 영화들을 한곳에서 보기",
    icon: Clapperboard,
  },
  {
    href: "/lobby/movies/commemorative",
    eyebrow: "CINEMO CURATION",
    title: "기념일 영화",
    description: "오늘의 의미와 함께 기억할 영화를 만나기",
    icon: Sparkles,
  },
  {
    href: "/lobby/movies/platform",
    eyebrow: "WATCH ANYWHERE",
    title: "플랫폼에서 볼 수 있는 영화",
    description: "대한민국에서 이용 가능한 플랫폼별 영화 찾기",
    icon: Tv,
  },
] as const;

export default function ListsPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-11rem)] w-full max-w-6xl px-6 py-14 sm:py-16">
      <header className="mb-10">
        <p className="text-xs font-semibold tracking-[0.32em] text-cinemo-gold">
          CINEMO LISTS
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-cinemo-text sm:text-4xl">
          영화 리스트
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-cinemo-muted sm:text-base">
          지금 보고 싶은 영화를 상황과 취향에 따라 찾아보기
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {movieLists.map((movieList) => {
          const Icon = movieList.icon;

          return (
            <Link
              key={movieList.href}
              href={movieList.href}
              className="group rounded-3xl border border-white/10 bg-[#101f21] p-6 transition hover:-translate-y-0.5 hover:border-cinemo-gold/50 hover:bg-[#142729] sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl border border-cinemo-gold/30 bg-cinemo-gold/10 text-cinemo-gold-light">
                  <Icon className="size-5" />
                </span>
                <ArrowUpRight className="size-5 text-cinemo-muted transition group-hover:text-cinemo-gold-light" />
              </div>
              <p className="mt-8 text-xs font-semibold tracking-[0.24em] text-cinemo-gold">
                {movieList.eyebrow}
              </p>
              <h2 className="mt-3 text-xl font-semibold text-cinemo-text sm:text-2xl">
                {movieList.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-cinemo-muted">
                {movieList.description}
              </p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
