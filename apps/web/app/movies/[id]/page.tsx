import { notFound } from "next/navigation";

import { getMovie } from "../../../lib/api/movies";
import { Bell } from "lucide-react";
import { MovieTrailerButton } from "@/components/movies/MovieTrailerButton";
import { MovieRecordActions } from "@/components/movies/MovieRecordActions";
import { MovieWatchedDate } from "@/components/movies/MovieWatchedDate";

type MoviePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params;
  const movie = await getMovie(id);

  if (!movie) {
    notFound();
  }
  const primaryTitle =
    movie.titles.find((item) => item.titleType === "PRIMARY") ??
    movie.titles[0];

  const originalTitle = movie.titles.find(
    (item) => item.titleType === "ORIGINAL",
  );

  const primaryRelease =
    movie.releases.find((date) => date.isPrimary) ?? movie.releases[0];

  const initialRelease = movie.releases
    .filter(
      (release) => release.releaseType === "INITIAL" && release.releaseDate,
    )
    .sort((a, b) => a.releaseDate!.localeCompare(b.releaseDate!))[0];

  const latestRerelease = movie.releases
    .filter(
      (release) => release.releaseType === "RERELEASE" && release.releaseDate,
    )
    .sort((a, b) =>
      (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""),
    )[0];

  const hasReleaseDate = movie.releases.some((release) => release.releaseDate);

  const isUpcoming = primaryRelease?.releaseDate
    ? new Date(`${primaryRelease.releaseDate}T00:00:00`) > new Date()
    : false;

  const formatReleaseDate = (date: string | null) =>
    date ? date.replaceAll("-", ".") : "개봉일 미정";

  const regionNames = new Intl.DisplayNames(["ko-KR"], { type: "region" });
  const productionCountries = movie.productionCountryCodes
    .map((code) => regionNames.of(code))
    .filter(Boolean)
    .join(" · ");

  const poster =
    movie.media.find((item) => item.mediaType === "POSTER" && item.isPrimary) ??
    movie.media.find((item) => item.mediaType === "POSTER");

  const backdrop =
    movie.media.find(
      (item) => item.mediaType === "BACKDROP" && item.isPrimary,
    ) ?? movie.media.find((item) => item.mediaType === "BACKDROP");

  const backgroundMedia = backdrop ?? poster;

  const trailer =
    movie.media.find(
      (media) =>
        media.mediaType.toUpperCase() === "TRAILER" &&
        media.sourceProvider.toUpperCase() === "YOUTUBE",
    ) ?? null;

  const directors = movie.credits.filter(
    (credit) => credit.creditType === "DIRECTOR",
  );

  const actors = movie.credits.filter(
    (credit) => credit.creditType === "ACTOR",
  );

  const runtimeText =
    movie.runtime !== null && movie.runtime !== undefined
      ? [
          Math.floor(movie.runtime / 60) > 0
            ? `${Math.floor(movie.runtime / 60)}시간`
            : null,
          movie.runtime % 60 > 0 ? `${movie.runtime % 60}분` : null,
        ]
          .filter(Boolean)
          .join("") || "0분"
      : "정보 없음 ";

  console.log(movie.runtime);

  const isAdultOnly = movie.certifications.some((certification) => {
    const normalizedCertification = certification.replace(/\s/g, "");

    return (
      normalizedCertification.includes("청소년관람불가") ||
      normalizedCertification.includes("19세")
    );
  });

  return (
    <main className="min-h-screen bg-[#071619] text-white">
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: backgroundMedia
            ? `linear-gradient(to bottom, rgba(7, 22, 25, 0.38), #071619 92%), url(${backgroundMedia.url})`
            : undefined,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-[#071619]/45" />

        <div className="relative mx-auto flex min-h-170 max-w-6xl items-end gap-10 px-6 py-16">
          <div className="hidden w-64 shrink-0 overflow-hidden rounded-2xl bg-white/5 shadow-2xl md:block">
            {poster ? (
              <img
                src={poster.url}
                alt={`${primaryTitle?.title ?? "영화"} 포스터`}
                className="aspect-2/3 h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-2/3 items-center justify-center border border-white/10 text-sm text-white/45">
                포스터 준비중
              </div>
            )}
          </div>

          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full border border-white/25 bg-black/25 px-3 py-1 text-sm text-white/80 leading-loose"
                >
                  {genre.name}
                </span>
              ))}
              {!hasReleaseDate && (
                <span className="rounded-full border border-cinemo-gold/45 bg-cinemo-gold/10 px-3 py-1 text-sm text-cinemo-gold-light">
                  개봉일 미정
                </span>
              )}
              {isAdultOnly && (
                <span
                  aria-label="청소년관람불가"
                  title="청소년관람불가"
                  className="inline-flex size-9 items-center justify-center rounded-lg border-2 border-red-400/70 bg-red-500/15 text-lg font-black leading-none text-red-300 shadow-[0_0_18px_rgba(239,68,68,0.16)]"
                >
                  <span className="relative top-px">19</span>
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              {primaryTitle?.title ?? "제목 없음"}
            </h1>

            {originalTitle && (
              <p className="mt-3 text-lg text-white/60">
                {originalTitle.title}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <MovieTrailerButton
                title={primaryTitle?.title ?? "영화"}
                trailer={trailer}
              />

              <MovieRecordActions movieId={id} />

              {isUpcoming && (
                <button
                  type="button"
                  className="group inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-semibold text-cinemo-muted backdrop-blur transition hover:border-cinemo-gold/40 hover:text-cinemo-gold-light"
                >
                  <Bell className="size-4 transition group-hover:scale-110" />
                  알림
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-12 md:grid-cols-[1fr_280px]">
        <div>
          <MovieWatchedDate movieId={id} />
          <h2 className="text-2xl font-bold">영화 소개</h2>

          {movie.overview ? (
            <p className="mt-4 leading-8 text-white/70">{movie.overview}</p>
          ) : (
            <p className="mt-4 leading-8 text-white/45">
              줄거리 정보가 없습니다.
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-6 text-sm text-white/65">
            <div>
              <span className="text-white/40">러닝타임</span>
              <p className="mt-1 text-base text-white">{runtimeText}</p>
            </div>

            <div>
              <span className="text-white/40">TMDB 평점</span>
              <p className="mt-1 text-base text-cinemo-gold-light">
                {movie.tmdbVoteAverage !== null
                  ? movie.tmdbVoteAverage.toFixed(1)
                  : "정보 없음"}
              </p>
            </div>

            <div>
              <span className="text-white/40">참여자</span>
              <p className="mt-1 text-base text-white">
                {movie.tmdbVoteCount !== null
                  ? `${movie.tmdbVoteCount.toLocaleString()}명`
                  : "정보 없음"}
              </p>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-2xl font-bold">감독</h2>

            <div className="mt-4 flex flex-wrap gap-3">
              {directors.length > 0 ? (
                directors.map((credit) => (
                  <button
                    key={credit.id}
                    className="rounded-lg bg-white/10 px-4 py-2 text-white/80 transition hover:bg-white/20"
                  >
                    {credit.person.name}
                  </button>
                ))
              ) : (
                <span className="text-white/50">정보 없음</span>
              )}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-2xl font-bold">등장인물</h2>

            <div className="mt-4 flex flex-wrap gap-3">
              {actors.length > 0 ? (
                actors.slice(0, 10).map((credit) => (
                  <button
                    key={credit.id}
                    className="rounded-lg bg-white/10 px-4 py-2 text-white/80 transition hover:bg-white/20"
                  >
                    {credit.person.name}
                  </button>
                ))
              ) : (
                <span className="text-white/50">정보 없음</span>
              )}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-bold">영화 정보</h2>

          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-white/40">개봉 정보</dt>

              <dd className="mt-2 space-y-2 text-white/80">
                {initialRelease?.releaseDate ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-white/45">최초 개봉</span>
                    <span>{formatReleaseDate(initialRelease.releaseDate)}</span>
                  </div>
                ) : null}

                {latestRerelease && (
                  <div className="flex justify-between gap-4">
                    <span className="text-white/45">재개봉</span>
                    <span>
                      {formatReleaseDate(latestRerelease.releaseDate)}
                    </span>
                  </div>
                )}

                {!initialRelease?.releaseDate && !latestRerelease && (
                  <div className="flex justify-between gap-4">
                    <span className="text-white/45">최초 개봉</span>
                    <span>{formatReleaseDate(null)}</span>
                  </div>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-white/40">제작 국가</dt>
              <dd className="mt-1 text-white/80">
                {movie.productionCountryCodes.length > 0
                  ? productionCountries
                  : "정보 없음"}
              </dd>
            </div>
          </dl>
        </aside>
      </section>
    </main>
  );
}
