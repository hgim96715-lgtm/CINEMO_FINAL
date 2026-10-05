"use client";

import { Suspense } from "react";
import {
  normalizeSearchText,
  useMovieSearchWithTmdbFallback,
} from "@/lib/queries/movie-search.query";
import { MovieSearchList } from "@/components/movies/MovieSearchList";
import { TmdbMovieSearchList } from "@/components/movies/TmdbMovieSearchList";
import { ApiErrorState } from "@/components/common/ApiErrorState";
import { useSearchParams } from "next/navigation";

function MoviesPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") ?? "";

  const { dbQuery, tmdbQuery, shouldFetchTmdb } =
    useMovieSearchWithTmdbFallback({
      query,
      page: 1,
      limit: 10,
    });

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

  const dbMovies = dbQuery.data?.items ?? [];
  const dbMovieTitles = new Set(
    dbMovies.map((movie) => normalizeSearchText(movie.title)),
  );
  const tmdbMovies = (tmdbQuery.data?.results ?? []).filter(
    (movie) => !dbMovieTitles.has(normalizeSearchText(movie.title)),
  );

  if (shouldFetchTmdb && tmdbQuery.isPending && dbMovies.length === 0) {
    return (
      <main className="min-h-[calc(100vh-5.5rem)] px-6 py-16">
        <div className="mx-auto max-w-6xl text-cinemo-muted">
          TMDB에서 영화를 찾는 중...
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

  if (dbMovies.length === 0 && tmdbMovies.length === 0) {
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
        <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-cinemo-text sm:text-4xl">
            &quot;{query}&quot; 검색 결과
          </h1>
          <p className="text-sm text-cinemo-muted">
            CINEMO {dbMovies.length}편 · TMDB {tmdbMovies.length}편
          </p>
        </div>
        {dbMovies.length > 0 && <MovieSearchList movies={dbMovies} />}

        {tmdbMovies.length > 0 && (
          <section className={dbMovies.length > 0 ? "mt-14" : undefined}>
            <div className="mb-6">
              <p className="mb-2 text-xs tracking-[0.24em] text-cinemo-gold">
                TMDB FALLBACK
              </p>
              <h2 className="text-2xl font-semibold text-cinemo-text">
                CINEMO에 없는 영화
              </h2>
              <p className="mt-2 text-sm text-cinemo-muted">
                선택하면 CINEMO에 저장하고 상세페이지로 이동함
              </p>
            </div>
            <TmdbMovieSearchList movies={tmdbMovies.slice(0, 10)} />
          </section>
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
