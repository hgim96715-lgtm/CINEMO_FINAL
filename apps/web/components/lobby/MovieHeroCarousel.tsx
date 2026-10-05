"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { movieDetailQueryOptions } from "@/lib/queries/movie-detail.query";
import { popularMoviesQueryOptions } from "@/lib/queries/movie-search.query";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

import { getTrailerEmbedUrl } from "@/lib/media/trailer";

export function MovieHeroCarousel() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const popularQuery = useQuery(
    popularMoviesQueryOptions({ page: 1, enabled: true, limit: 20 }),
  );

  const hasKorean = (value: string) => /[가-힣0-9]/.test(value);
  const movies =
    popularQuery.data?.items.filter(
      (movie) => hasKorean(movie.title) && movie.hasTrailer,
    ) ?? [];

  const currentMovie = movies[selectedIndex] ?? movies[0];
  const movieDetailQuery = useQuery(
    movieDetailQueryOptions(currentMovie?.id ?? ""),
  );

  const detail = movieDetailQuery.data;

  const trailer = detail?.media.find(
    (media) =>
      media.mediaType.toUpperCase() === "TRAILER" &&
      media.sourceProvider.toUpperCase() === "YOUTUBE",
  );
  const trailerEmbedUrl = getTrailerEmbedUrl(trailer);

  useEffect(() => {
    if (
      movies.length <= 1 ||
      isTrailerOpen ||
      window.matchMedia("(max-width: 639px)").matches
    ) {
      return;
    }

    const timerId = window.setInterval(() => {
      setSelectedIndex((index) => (index + 1) % movies.length);
    }, 10_000);

    return () => window.clearInterval(timerId);
  }, [movies.length, isTrailerOpen]);

  if (!currentMovie) return null;

  const title =
    detail?.titles.find((item) => item.titleType === "PRIMARY")?.title ??
    detail?.titles[0]?.title ??
    currentMovie.title;

  const releaseDate =
    detail?.releases.find((release) => release.isPrimary)?.releaseDate ??
    currentMovie.releaseDate;

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
      className="relative isolate mx-auto min-h-[clamp(22rem,42vw,28rem)] w-full max-w-[120rem] overflow-hidden rounded-[2rem] bg-cinemo-surface text-cinemo-text shadow-[0_2rem_5rem_rgb(0_0_0_/24%),inset_0_1px_0_rgb(255_255_255_/10%)] max-[639px]:min-h-[clamp(28rem,110vw,32rem)] max-[639px]:rounded-[1.25rem]"
      aria-label="인기 영화"
    >
      {backgroundUrl ? (
        <Image
          key={`${currentMovie.id}-background`}
          src={backgroundUrl}
          alt=""
          fill
          sizes="(min-width: 640px) 100vw, 0px"
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
          sizes="(max-width: 639px) 100vw, 0px"
          loading="eager"
          className="z-0 hidden object-cover object-top max-[639px]:block max-[639px]:opacity-90 max-[639px]:saturate-[0.92] max-[639px]:brightness-[0.82]"
          aria-hidden
        />
      ) : null}
      <div
        className="absolute inset-0 z-1 bg-[linear-gradient(90deg,rgb(23_21_21_/76%)_0%,rgb(23_21_21_/40%)_38%,rgb(23_21_21_/10%)_78%,transparent_100%),linear-gradient(0deg,rgb(23_21_21_/72%)_0%,rgb(23_21_21_/18%)_30%,transparent_58%)] max-[639px]:bg-[linear-gradient(0deg,rgba(23,21,21,0.94)_0%,rgba(23,21,21,0.68)_42%,rgba(23,21,21,0.18)_78%,transparent_100%),linear-gradient(90deg,rgba(23,21,21,0.34)_0%,transparent_80%)]"
        aria-hidden
      />
      <div className="relative z-2 flex min-h-[clamp(22rem,42vw,28rem)] items-end justify-between gap-8 p-[clamp(2rem,6vw,3rem)] pb-[clamp(4rem,9vw,5.5rem)] drop-shadow-[0_0.2rem_0.8rem_rgb(0_0_0_/60%)] max-sm:min-h-[clamp(28rem,110vw,32rem)] max-sm:p-6 max-sm:pb-8">
        <div className="max-w-120 max-sm:w-full max-sm:max-w-none">
          <p className="mb-4 text-[0.72rem] tracking-[0.28em] text-primary">
            CINEMO FEATURED MOVIE
          </p>

          <h1 className="m-0 font-serif text-[clamp(2rem,5.5vw,3.5rem)] font-semibold leading-[1.08] max-sm:text-[clamp(1.65rem,8vw,2.4rem)]">
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
            {trailerEmbedUrl ? (
              <Button
                type="button"
                variant="cinemo-primary"
                size="lg"
                onClick={() => setIsTrailerOpen(true)}
                className="h-11 px-5 font-semibold max-sm:w-full"
              >
                <Play
                  size={16}
                  fill="currentColor"
                  className="text-cinemo-teal-light transition-colors group-hover/button:text-cinemo-text group-active/button:text-cinemo-text"
                />
                예고편
              </Button>
            ) : null}
            <Button
              render={<Link href={`/movies/${currentMovie.id}`} />}
              nativeButton={false}
              variant="cinemo-secondary"
              size="lg"
              className="h-11 px-5 font-semibold no-underline max-sm:w-full"
            >
              자세히 보기
            </Button>
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
      <Dialog open={isTrailerOpen} onOpenChange={setIsTrailerOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] overflow-hidden border-0 bg-black p-0 sm:w-[calc(100%-3rem)] sm:max-w-5xl">
          <DialogTitle className="sr-only">{title} 예고편</DialogTitle>

          <DialogDescription className="sr-only">
            {title} 영화 예고편
          </DialogDescription>

          <div className="aspect-video w-full">
            <iframe
              src={trailerEmbedUrl ?? undefined}
              title={`${title} 예고편`}
              className="h-full w-full"
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
