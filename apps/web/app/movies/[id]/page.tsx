import { notFound } from "next/navigation";

import { getMovie } from "../../../lib/api/movies";

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

  const primaryRelease =
    movie.releases.find((item) => item.isPrimary) ?? movie.releases[0];

  const poster = movie.media.find(
    (item) => item.mediaType === "POSTER" && item.isPrimary,
  );

  const directors = movie.credits.filter(
    (credit) => credit.creditType === "DIRECTOR",
  );

  const actors = movie.credits.filter(
    (credit) => credit.creditType === "ACTOR",
  );

  return (
    <main className="min-h-screen bg-transparent px-6 py-12 text-cinemo-text">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 md:grid-cols-[280px_1fr]">
          {poster ? (
            <img
              src={poster.url}
              alt={`${primaryTitle?.title ?? "영화"} 포스터`}
              className="w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="flex aspect-2/3 items-center justify-center rounded-2xl bg-card text-cinemo-placeholder">
              포스터 없음
            </div>
          )}

          <section className="rounded-2xl bg-cinemo-surface p-6 backdrop-blur-md md:p-8">
            <h1 className="text-4xl font-bold">
              {primaryTitle?.title ?? "제목 없음"}
            </h1>

            {primaryRelease?.releaseDate && (
              <p className="mt-3 text-cinemo-muted">
                개봉일 {primaryRelease.releaseDate}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-lg border border-cinemo-gold/25 bg-cinemo-gold/8 px-3 py-1 text-sm text-cinemo-text"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <div className="mt-8 space-y-3 text-cinemo-muted">
              <p>
                감독:{" "}
                {directors.map((credit) => credit.person.name).join(", ") ||
                  "정보 없음"}
              </p>

              <p>
                출연:{" "}
                {actors
                  .slice(0, 10)
                  .map((credit) => credit.person.name)
                  .join(", ") || "정보 없음"}
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
