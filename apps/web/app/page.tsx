"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/lobby");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#101014] text-[#f3efe6]">
      <section className="text-center">
        <h1 className="text-5xl font-bold tracking-[6px]">CINEMO</h1>

        <p className="mt-5 text-base text-[#958d82]">
          영화의 순간을 모으다
        </p>
      </section>
    </main>
  );
}
