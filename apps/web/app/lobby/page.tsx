import { CINEMO_BRAND } from "@cinemo/shared";

export default function LobbyPage() {
  return (
    <main className="min-h-screen bg-[#151515] text-[#f3efe6]">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col justify-center px-6">
        <p className="mb-4 text-sm tracking-[0.3em] text-[#d99a45]">
          {CINEMO_BRAND.name}
        </p>

        <h1 className="max-w-2xl text-5xl font-bold leading-tight">
          {CINEMO_BRAND.slogan}
        </h1>

        <p className="mt-6 max-w-xl text-lg text-[#b8b1a5]">
          {CINEMO_BRAND.description}
        </p>
      </section>
    </main>
  );
}
