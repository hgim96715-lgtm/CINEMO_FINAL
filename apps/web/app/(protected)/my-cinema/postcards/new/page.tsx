import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getCachedMovie } from "@/lib/api/server-movies";
import Image from "next/image";
import { PostcardCreateForm } from "@/components/postcard/PostcardCreateForm";

type PostcardCreatePageProps = {
  searchParams: Promise<{
    movieId?: string;
  }>;
};

export default async function PostcardCreatePage({
  searchParams,
}: PostcardCreatePageProps) {
  const { movieId } = await searchParams;
  if (!movieId) {
    notFound();
  }
  const movie = await getCachedMovie(movieId);
  if (!movie) {
    notFound();
  }
  const title =
    movie.titles.find((item) => item.titleType === "PRIMARY") ??
    movie.titles[0];

  const poster =
    movie.media.find((item) => item.mediaType === "POSTER" && item.isPrimary) ??
    movie.media.find((item) => item.mediaType == "POSTER");
  const backdrop =
    movie.media.find(
      (item) => item.mediaType === "BACKDROP" && item.isPrimary,
    ) ?? movie.media.find((item) => item.mediaType === "BACKDROP");
  const postcardBackground = backdrop ?? poster;
  return (
    <main className="min-h-[calc(100vh-11rem)] px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/my-cinema?tab=postcards"
          aria-label="내 엽서로 돌아가기"
          className="inline-flex items-center text-sm text-cinemo-muted transition hover:text-cinemo-text"
        >
          <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
          <span>내 엽서로 돌아가기</span>
        </Link>

        <header className="mt-8">
          <p className="text-sm font-semibold tracking-[0.2em] text-cinemo-gold">
            CREATE POSTCARD
          </p>

          <h1 className="mt-3 text-3xl font-bold text-cinemo-text">
            영화의 순간을 엽서로 남기기
          </h1>
        </header>

        <section className="mt-8 overflow-visible rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-black/10 sm:p-8">
          <div className="flex items-center gap-4 border-b border-white/10 pb-6">
            {poster?.url ? (
              <Image
                src={poster.url}
                alt={`${title?.title ?? "영화"} 포스터`}
                width={80}
                height={120}
                className="h-30 w-20 rounded-lg bg-black/20 object-contain"
              />
            ) : (
              <div className="flex h-30 w-20 items-center justify-center rounded-lg bg-white/10 text-xs text-cinemo-muted">
                포스터 없음
              </div>
            )}

            <div>
              <p className="text-xs text-cinemo-gold">선택한 영화</p>
              <h2 className="mt-2 text-xl font-semibold text-cinemo-text">
                {title?.title ?? "제목 없음"}
              </h2>
            </div>
          </div>

          <div className="mt-6">
            <PostcardCreateForm
              movieId={movieId}
              movieTitle={title?.title ?? "영화"}
              backgroundUrl={postcardBackground?.url ?? null}
              backgroundType={backdrop ? "BACKDROP" : "POSTER"}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
