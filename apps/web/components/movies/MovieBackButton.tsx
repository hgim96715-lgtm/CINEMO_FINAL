"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function MovieBackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/lobby");
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/25 px-3 py-2 text-sm text-white/80 backdrop-blur transition hover:border-white/40 hover:bg-black/40 hover:text-white"
    >
      <ArrowLeft className="size-4" />
      이전으로
    </button>
  );
}
