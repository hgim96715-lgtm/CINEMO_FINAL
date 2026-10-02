import Link from "next/link";
import Image from "next/image";
import type { MovieSearchItemResponse } from "@cinemo/api-contract";

type MovieSearchListProps = {
  movies: MovieSearchItemResponse[];
};

export function MovieSearchList({ movies }: MovieSearchListProps) {
  return (
    <ul>
      {movies.map((movie) => (
        <li key={movie.id}>
          <Link href={`/movies/${movie.id}`}>
            {movie.posterUrl ? (
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                width={100}
                height={270}
              />
            ) : (
              <div aria-label={`${movie.title} poster`}>포스터 없음</div>
            )}

            <h2>{movie.title}</h2>
            {movie.releaseDate && (
              <time dateTime={movie.releaseDate}>
                {movie.releaseDate.slice(0, 10)}
              </time>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
