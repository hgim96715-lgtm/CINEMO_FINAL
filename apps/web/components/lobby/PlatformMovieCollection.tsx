"use client";

import type { MovieSearchItemResponse } from "@cinemo/api-contract";
import { useQueries } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import type { ViewingPlatform } from "@/lib/api/movies";
import { watchProviderMoviesQueryOptions } from "@/lib/queries/movie-search.query";

export const PLATFORM_PROVIDERS = [
  { provider: "NETFLIX", label: "Netflix" },
  { provider: "WATCHA", label: "Watcha" },
  { provider: "TVING", label: "TVING" },
  { provider: "DISNEY_PLUS", label: "Disney+" },
  { provider: "WAVVE", label: "Wavve" },
  { provider: "APPLE_TV", label: "Apple TV+" },
  { provider: "PRIME_VIDEO", label: "Prime Video" },
] satisfies Array<{provider: ViewingPlatform; label: string}>;

export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w185";

export type PlatformProvider = {
  provider: ViewingPlatform;
  label: string;
  logoPath: string | null;
};

export type PlatformMovie = {
  movie: MovieSearchItemResponse;
  providers: PlatformProvider[];
};

function getMovieProviders(movie: MovieSearchItemResponse): PlatformProvider[] {
  const providers = new Map<ViewingPlatform, PlatformProvider>();

  for (const option of movie.watchOptions) {
    const provider = PLATFORM_PROVIDERS.find(
      (item) => item.provider === option.watchProvider,
    );

    if (!provider || providers.has(provider.provider)) continue;

    providers.set(provider.provider, {
      provider: provider.provider,
      label: provider.label,
      logoPath: option.logoPath ?? null,
    });
  }

  return Array.from(providers.values());
}

export function usePlatformMovies(limit = 20) {
  const providerQueries = useQueries({
    queries: PLATFORM_PROVIDERS.map(({ provider }) =>
      watchProviderMoviesQueryOptions({
        provider,
        page: 1,
        limit,
      }),
    ),
  });

  const movies = useMemo<PlatformMovie[]>(() => {
    const movieMap = new Map<string, PlatformMovie>();

    providerQueries.forEach((query) => {
      query.data?.items.forEach((movie) => {
        if (!movie.title || !movie.posterUrl) return;

        const movieProviders = getMovieProviders(movie);

        const existing = movieMap.get(movie.id);

        if (existing) {
          for (const provider of movieProviders) {
            if (
              !existing.providers.some(
                (existingProvider) =>
                  existingProvider.provider === provider.provider,
              )
            ) {
              existing.providers.push(provider);
            }
          }
          return;
        }

        movieMap.set(movie.id, {
          movie,
          providers: movieProviders,
        });
      });
    });

    return Array.from(movieMap.values()).slice(0, limit);
  }, [limit, providerQueries]);

  return {
    movies,
    isPending: providerQueries.every((query) => query.isPending),
    isError: providerQueries.some((query) => query.isError),
  };
}

export function PlatformMovieCollection() {
  const { movies, isPending } = usePlatformMovies();

  if (isPending || movies.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="platform-movie-collection-title"
      className="mt-12 sm:mt-16"
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs tracking-[0.24em] text-primary">
            WATCH ANYWHERE
          </p>
          <h2
            id="platform-movie-collection-title"
            className="text-2xl font-semibold text-foreground sm:text-3xl"
          >
            플랫폼에서 볼 수 있는 영화
          </h2>
        </div>

        <Link
          href="/lobby/movies/platform"
          className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition hover:text-primary"
        >
          더보기
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <ol className="flex gap-4 overflow-x-auto pb-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {movies.map(({ movie, providers }) => (
          <li
            key={movie.id}
            className="w-32 shrink-0 sm:w-40 max-sm:w-[34vw] max-sm:snap-center"
          >
            <Link href={`/movies/${movie.id}`} className="group block">
              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-card">
                <Image
                  src={movie.posterUrl!}
                  alt={`${movie.title} 포스터`}
                  fill
                  sizes="(min-width: 640px) 160px, 34vw"
                  className="object-contain bg-black transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-x-2 top-2 flex flex-wrap gap-1.5">
                  {providers.map((provider) => (
                    <span
                      key={provider.provider}
                      title={provider.label}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg shadow-lg"
                    >
                      {provider.logoPath ? (
                        <Image
                          src={`${TMDB_IMAGE_BASE_URL}${provider.logoPath}`}
                          alt={provider.label}
                          width={40}
                          height={40}
                          className="h-7 w-7 rounded-lg object-contain"
                        />
                      ) : (
                        <span className="text-[8px] font-bold text-white/80">
                          {provider.label}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="mt-3 truncate text-sm font-medium text-foreground">
                {movie.title}
              </h3>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
