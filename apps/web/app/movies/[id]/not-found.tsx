import Link from "next/link";

export default function MovieNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#101014] px-6 text-[#f3efe6]">
      <section className="text-center">
        <p className="text-sm text-[#958d82]">MOVIE NOT FOUND</p>

        <h1 className="mt-4 text-3xl font-bold">영화를 찾을 수 없습니다.</h1>

        <p className="mt-3 text-[#958d82]">
          요청한 영화가 없거나 아직 등록되지 않았습니다.
        </p>

        <Link
          href="/lobby"
          className="mt-8 inline-flex rounded-full bg-[#f3efe6] px-5 py-3 text-sm font-semibold text-[#101014]"
        >
          Lobby로 이동
        </Link>
      </section>
    </main>
  );
}
