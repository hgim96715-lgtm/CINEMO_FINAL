import Link from "next/link";
import type { UnifiedSearchGenre } from "@cinemo/api-contract";

type GenreSearchListProps = {
  genres: UnifiedSearchGenre[];
  compact?: boolean;
  onSelect?: () => void;
};

export function GenreSearchList({
  genres,
  compact = false,
  onSelect,
}: GenreSearchListProps) {
  return (
    <ul className={compact ? "flex flex-wrap gap-2" : "grid gap-3 sm:grid-cols-2"}>
      {genres.map((genre) => (
        <li key={genre.name}>
          <Link
            href={`/lobby/movies?query=${encodeURIComponent(genre.name)}`}
            onClick={onSelect}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm transition hover:border-cinemo-gold/50 hover:bg-white/10"
          >
            <span className="text-cinemo-text">{genre.name}</span>
            <span className="text-xs text-cinemo-gold-light">
              영화 {genre.count}편
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
