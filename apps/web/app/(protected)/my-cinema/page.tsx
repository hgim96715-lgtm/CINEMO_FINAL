import { requireUser } from "@/lib/auth/server";

export default async function MyCinemaPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto min-h-[calc(100vh-11rem)] w-full max-w-6xl px-6 py-16">
      <p className="text-sm font-semibold tracking-[0.3em] text-cinemo-gold">
        MY CINEMA
      </p>

      <h1 className="mt-4 text-3xl font-bold text-cinemo-text">
        {user.nickname}의 영화 공간
      </h1>

      <p className="mt-3 text-cinemo-muted">
        로그인된 사용자만 이용할 수 있는 공간
      </p>
    </main>
  );
}
