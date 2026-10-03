import Link from "next/link";

export default function MovieNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-transparent px-6 text-cinemo-text">
      <section className="text-center">
        <p className="text-sm text-cinemo-gold">MOVIE NOT FOUND</p>

        <h1 className="mt-4 text-3xl font-bold">영화를 찾을 수 없습니다.</h1>

        <p className="mt-3 text-cinemo-muted">
          요청한 영화가 없거나 아직 등록되지 않았습니다.
        </p>

        <Link
          href="/lobby"
          className="mt-8 inline-flex rounded-lg bg-cinemo-text px-5 py-3 text-sm font-semibold text-cinemo-bg-deep"
        >
          Lobby로 이동
        </Link>
      </section>
    </main>
  );
}
