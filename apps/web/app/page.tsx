"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { CINEMO_BRAND } from "@cinemo/shared";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/lobby");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main
      className="flex min-h-screen items-center justify-center"
      style={{
        backgroundColor: CINEMO_BRAND.colors.background,
        color: CINEMO_BRAND.colors.textPrimary,
      }}
    >
      <section className="text-center">
        <h1 className="text-5xl font-bold tracking-[6px]">
          {CINEMO_BRAND.name}
        </h1>

        <p
          className="mt-5 text-base"
          style={{ color: CINEMO_BRAND.colors.textSecondary }}
        >
          {CINEMO_BRAND.slogan}
        </p>
      </section>
    </main>
  );
}
