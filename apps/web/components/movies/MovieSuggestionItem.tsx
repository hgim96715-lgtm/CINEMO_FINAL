import Image from "next/image";
import Link from "next/link";
import type { MovieSearchItemResponse } from "@cinemo/api-contract";

type MovieSuggestionItemProps = {
  movie: MovieSearchItemResponse;
  onSelect: () => void;
};

export function MovieSuggestionItem({
  movie,
  onSelect,
}: MovieSuggestionItemProps) {
  return (
    <li className="overflow-hidden rounded-xl transition hover:bg-white/10">
      <Link
        href={`/movies/${movie.id}`}
        onClick={onSelect}
        className="flex items-center gap-3 p-2 md:gap-4 md:p-3"
      >
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={`${movie.title} 포스터`}
            width={40}
            height={60}
            className="h-[60px] w-10 rounded-md object-cover md:h-24 md:w-16"
          />
        ) : (
          <span className="flex h-[60px] w-10 items-center justify-center rounded-md bg-white/10 text-xs text-white/50 md:h-24 md:w-16">
            없음
          </span>
        )}

        <span className="truncate text-sm text-cinemo-text md:text-base">
          {movie.title}
        </span>
      </Link>
    </li>
  );
}
