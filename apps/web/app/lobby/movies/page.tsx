"use client";

import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import {
  normalizeSearchText,
  tmdbMovieSearchQueryOptions,
  unifiedSearchQueryOptions,
} from "@/lib/queries/movie-search.query";
import { MovieSearchList } from "@/components/movies/MovieSearchList";
import { TmdbMovieSearchList } from "@/components/movies/TmdbMovieSearchList";
import { PersonSearchList } from "@/components/search/PersonSearchList";
import { GenreSearchList } from "@/components/search/GenreSearchList";
import { ApiErrorState } from "@/components/common/ApiErrorState";
import { useSearchParams } from "next/navigation";

function MoviesPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") ?? "";

  const dbQuery = useQuery(
    unifiedSearchQueryOptions({
      query,
      page: 1,
      limit: 10,
    }),
  );
  const shouldFetchTmdb =
    dbQuery.isSuccess && dbQuery.data.movies.length < 10;
  const tmdbQuery = useQuery(
    tmdbMovieSearchQueryOptions({
      query,
      page: 1,
      enabled: shouldFetchTmdb,
    }),
  );

  if (!query) {
    return (
      <main className="min-h-[calc(100vh-5.5rem)] px-6 py-16">
        <div className="mx-auto max-w-6xl text-cinemo-muted">
          검색어를 입력해주세요.
        </div>
      </main>
    );
  }
  if (dbQuery.isPending) {
    return (
      <main className="min-h-[calc(100vh-5.5rem)] px-6 py-16">
        <div className="mx-auto max-w-6xl text-cinemo-muted">
          영화를 불러오는 중...
        </div>
      </main>
    );
  }
  if (dbQuery.isError) {
    return (
      <ApiErrorState
        message="영화 검색 결과를 불러오지 못했습니다."
        onRetry={() => dbQuery.refetch()}
      />
    );
  }

  const dbMovies = dbQuery.data?.movies ?? [];
  const people = dbQuery.data?.people ?? [];
  const genres = dbQuery.data?.genres ?? [];
  const dbMovieTitles = new Set(
    dbMovies.map((movie) => normalizeSearchText(movie.title)),
  );
  const tmdbMovies = (tmdbQuery.data?.results ?? [])
    .filter((movie) => /[가-힣]/.test(movie.title))
    .filter((movie) => Boolean(movie.poster_path))
    .filter(
      (movie) => !dbMovieTitles.has(normalizeSearchText(movie.title)),
    )
    .filter((movie, index, results) => {
    const normalizedTitle = normalizeSearchText(movie.title);

    return (
      results.findIndex(
        (candidate) =>
          normalizeSearchText(candidate.title) === normalizedTitle,
      ) === index
    );
  });

  if (shouldFetchTmdb && tmdbQuery.isPending && dbMovies.length === 0) {
    return (
      <main className="min-h-[calc(100vh-5.5rem)] px-6 py-16">
        <div className="mx-auto max-w-6xl text-cinemo-muted">
          추가 영화를 찾는 중...
        </div>
      </main>
    );
  }

  if (shouldFetchTmdb && tmdbQuery.isError && dbMovies.length === 0) {
    return (
      <ApiErrorState
        message="검색 결과를 불러오지 못했습니다."
        onRetry={() => tmdbQuery.refetch()}
      />
    );
  }

  if (
    dbMovies.length === 0 &&
    tmdbMovies.length === 0 &&
    people.length === 0 &&
    genres.length === 0
  ) {
    return (
      <main className="min-h-[calc(100vh-5.5rem)] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-xs tracking-[0.28em] text-cinemo-gold">
            CINEMO SEARCH
          </p>
          <h1 className="text-3xl font-semibold text-cinemo-text sm:text-4xl">
            &quot;{query}&quot; 검색 결과
          </h1>
          <p className="mt-4 text-cinemo-muted">검색 결과가 없습니다.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5.5rem)] px-6 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-xs tracking-[0.28em] text-cinemo-gold">
          CINEMO SEARCH
        </p>
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-cinemo-text sm:text-4xl">
            &quot;{query}&quot; 검색 결과
          </h1>
        </div>
        {people.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-5 text-xl font-semibold text-cinemo-text">
              인물
            </h2>
            <PersonSearchList people={people} />
          </section>
        )}

        {genres.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-5 text-xl font-semibold text-cinemo-text">
              장르
            </h2>
            <GenreSearchList genres={genres} />
          </section>
        )}

        {dbMovies.length > 0 && (
          <section>
            <h2 className="mb-5 text-xl font-semibold text-cinemo-text">
              영화
            </h2>
            <MovieSearchList movies={dbMovies} />
          </section>
        )}

        {tmdbMovies.length > 0 && (
          <div className={dbMovies.length > 0 ? "mt-14" : undefined}>
            <TmdbMovieSearchList movies={tmdbMovies.slice(0, 10)} />
          </div>
        )}
      </div>
    </main>
  );
}

export default function MoviesPage() {
  return (
    <Suspense fallback={<main>검색 결과를 불러오는 중...</main>}>
      <MoviesPageContent />
    </Suspense>
  );
}
