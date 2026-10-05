import Link from "next/link";
import Image from "next/image";
import type { MovieSearchItemResponse } from "@cinemo/api-contract";

type MovieSearchListProps = {
  movies: MovieSearchItemResponse[];
};

export function MovieSearchList({ movies }: MovieSearchListProps) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {movies.map((movie) => (
        <li key={movie.id} className="min-w-0">
          <Link href={`/movies/${movie.id}`} className="group block">
            <div className="relative aspect-2/3 overflow-hidden rounded-2xl border border-white/10 bg-cinemo-surface">
              {movie.posterUrl ? (
                <Image
                  src={movie.posterUrl}
                  alt={`${movie.title} 포스터`}
                  fill
                  sizes="(min-width: 1024px) 224px, (min-width: 640px) 30vw, 45vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-cinemo-muted">
                  포스터 준비중
                </div>
              )}

              {movie.isAdultOnly && (
                <span
                  aria-label="청소년관람불가"
                  title="청소년관람불가"
                  className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-md border-2 border-red-300/70 bg-red-500/55 text-base font-black leading-none text-red-50 shadow-[0_0_10px_rgba(239,68,68,0.14)] backdrop-blur-sm"
                >
                  <span className="relative top-px">19</span>
                </span>
              )}
            </div>

            <h2 className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-cinemo-text transition group-hover:text-cinemo-gold-light sm:text-base">
              {movie.title}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-cinemo-muted">
              {movie.releaseDate && (
                <time dateTime={movie.releaseDate}>
                  {movie.releaseDate.slice(0, 10).replaceAll("-", ".")}
                </time>
              )}
              {movie.genres.slice(0, 2).map((genre) => (
                <span key={genre}>{genre}</span>
              ))}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
