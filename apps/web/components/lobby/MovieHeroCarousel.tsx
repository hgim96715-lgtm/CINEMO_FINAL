"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { movieDetailQueryOptions } from "@/lib/queries/movie-detail.query";
import { popularMoviesQueryOptions } from "@/lib/queries/movie-search.query";
import { cn } from "@/lib/utils";

export function MovieHeroCarousel() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popularQuery = useQuery(
    popularMoviesQueryOptions({ page: 1, enabled: true, limit: 20 }),
  );

  const hasKorean = (value: string) => /[가-힣]/.test(value);
  const movies =
    popularQuery.data?.items.filter(
      (movie) => hasKorean(movie.title) && movie.hasTrailer,
    ) ?? [];
  const currentMovie = movies[selectedIndex] ?? movies[0];
  const movieDetailQuery = useQuery(
    movieDetailQueryOptions(currentMovie?.id ?? ""),
  );

  const detail = movieDetailQuery.data;
  const trailer = detail?.media.find((media) =>
    Boolean(media.mediaType.toUpperCase() === "TRAILER"),
  );

  useEffect(() => {
    if (movies.length === 0) return;

    const isMobile = window.matchMedia("(max-width: 639px)").matches;

    if (isMobile) {
      setSelectedIndex(Math.floor(Math.random() * movies.length));
      return;
    }

    if (movies.length <= 1) return;

    const timerId = window.setInterval(() => {
      setSelectedIndex((index) => (index + 1) % movies.length);
    }, 10_000);

    return () => window.clearInterval(timerId);
  }, [movies.length]);

  if (!currentMovie) return null;

  const title =
    detail?.titles.find((item) => item.titleType === "PRIMARY")?.title ??
    detail?.titles[0]?.title ??
    currentMovie.title;

  const releaseDate =
    detail?.releases.find((release) => release.isPrimary)?.releaseDate ??
    currentMovie.releaseDate;

  const backdrop =
    detail?.media.find(
      (media) =>
        media.mediaType.toUpperCase() === "BACKDROP" && media.isPrimary,
    ) ??
    detail?.media.find((media) => media.mediaType.toUpperCase() === "BACKDROP");

  const poster =
    detail?.media.find(
      (media) => media.mediaType.toUpperCase() === "POSTER" && media.isPrimary,
    ) ??
    detail?.media.find((media) => media.mediaType.toUpperCase() === "POSTER");

  const backgroundUrl =
    detail?.media.find((media) => media.mediaType.toUpperCase() === "BACKDROP")
      ?.url ?? null;
  const posterUrl = poster?.url ?? currentMovie.posterUrl;
  const genres =
    detail?.genres.map((genre) => genre.name) ?? currentMovie.genres;

  return (
    <section
      className="relative isolate mx-auto min-h-[clamp(22rem,42vw,28rem)] w-full max-w-[120rem] overflow-hidden rounded-[2rem] bg-white/3 text-[#f3efe6] shadow-[0_2rem_5rem_rgb(0_0_0_/24%),inset_0_1px_0_rgb(255_255_255_/10%)] max-[639px]:min-h-[clamp(28rem,110vw,32rem)] max-[639px]:rounded-[1.25rem]"
      aria-label="인기 영화"
    >
      {backgroundUrl ? (
        <Image
          key={`${currentMovie.id}-background`}
          src={backgroundUrl}
          alt=""
          fill
          loading="eager"
          className="z-0 scale-[1.04] object-cover object-center opacity-90 saturate-[1.05] brightness-[0.95] blur-xs max-[639px]:hidden"
          aria-hidden
        />
      ) : null}

      {posterUrl ? (
        <Image
          src={posterUrl}
          alt=""
          fill
          loading="eager"
          className="z-0 hidden object-cover object-top max-[639px]:block max-[639px]:opacity-90 max-[639px]:saturate-[0.92] max-[639px]:brightness-[0.82]"
          aria-hidden
        />
      ) : null}
      <div
        className="absolute inset-0 z-1 bg-[linear-gradient(90deg,rgb(23_21_21_/68%)_0%,rgb(23_21_21_/34%)_38%,rgb(23_21_21_/8%)_78%,transparent_100%),linear-gradient(0deg,rgb(23_21_21_/64%)_0%,rgb(23_21_21_/14%)_30%,transparent_58%)] max-[639px]:bg-[linear-gradient(0deg,rgba(23,21,21,0.86)_0%,rgba(23,21,21,0.48)_42%,rgba(23,21,21,0.08)_78%,transparent_100%),linear-gradient(90deg,rgba(23,21,21,0.2)_0%,transparent_75%)]"
        aria-hidden
      />
      <div className="relative z-2 flex min-h-[clamp(22rem,42vw,28rem)] items-end justify-between gap-8 p-[clamp(2rem,6vw,3rem)] pb-[clamp(4rem,9vw,5.5rem)] max-sm:min-h-[clamp(28rem,110vw,32rem)] max-sm:p-6 max-sm:pb-8">
        <div className="max-w-120 max-sm:w-full max-sm:max-w-none">
          <p className="mb-4 text-[0.72rem] tracking-[0.28em] text-primary">
            CINEMO FEATURED MOVIE
          </p>

          <h1 className="m-0 font-serif text-[clamp(2rem,5.5vw,3.5rem)] font-semibold leading-[1.08] max-sm:text-[clamp(1.8rem,9vw,2.7rem)]">
            {title}
          </h1>

          <div className="mt-5 flex flex-wrap gap-[0.55rem] text-[0.82rem] text-white/78">
            {genres.slice(0, 3).map((genre, index) => (
              <span key={genre}>
                {index > 0 ? "• " : ""}
                {genre}
              </span>
            ))}
            {releaseDate ? <span>• {releaseDate.slice(0, 4)}</span> : null}
          </div>

          <div className="mt-8 flex items-center gap-4 max-sm:mt-6  max-sm:flex-col max-sm:gap-[0.6rem] ">
            예고편
            <Link
              href={`/movies/${currentMovie.id}`}
              className="inline-flex items-center justify-center gap-[0.45rem] rounded-full bg-black/28 px-[1.2rem] py-3 text-[0.85rem] font-bold text-[#f3efe6] no-underline transition-colors hover:bg-white/18 max-sm:w-full"
            >
              자세히 보기
            </Link>
          </div>
        </div>

        {posterUrl ? (
          <div className="hidden w-42 shrink-0 overflow-hidden rounded-[0.9rem] border border-white/22 shadow-[0_1.5rem_3rem_rgb(0_0_0_/38%)] sm:block">
            <Image
              src={posterUrl}
              alt={`${title} 포스터`}
              width={500}
              height={750}
              sizes="208px"
              loading="eager"
              className="block aspect-2/3 h-auto w-full object-cover"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
