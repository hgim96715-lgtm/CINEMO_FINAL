"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { postcardDetailQueryOptions } from "@/lib/queries/postcard-detail.query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PostcardEditForm } from "@/components/postcard/PostcardEditForm";

export default function PostcardEditPage() {
  const { id } = useParams<{ id: string }>();
  const postcardQuery = useQuery(postcardDetailQueryOptions(id));

  if (postcardQuery.isPending) {
    return (
      <main className="min-h-screen px-4 py-10 text-cinemo-text">
        엽서를 불러오는 중...
      </main>
    );
  }
  if (postcardQuery.isError || !postcardQuery.data) {
    return (
      <main className="min-h-screen px-4 py-10 text-cinemo-text">
        <p>엽서를 불러오지 못했습니다.</p>

        <Link
          href="/my-cinema?tab=postcards"
          className="mt-4 inline-flex text-cinemo-gold"
        >
          내 엽서로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/my-cinema?tab=postcards"
          className="inline-flex items-center gap-2 text-sm text-cinemo-muted hover:text-cinemo-text"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />내 엽서로 돌아가기
        </Link>

        <header className="mt-8">
          <p className="text-sm font-semibold tracking-[0.2em] text-cinemo-gold">
            EDIT POSTCARD
          </p>

          <h1 className="mt-3 text-3xl font-bold text-cinemo-text">
            엽서 수정하기
          </h1>
        </header>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/3 p-4 sm:p-8">
          <PostcardEditForm postcard={postcardQuery.data} />
        </section>
      </div>
    </main>
  );
}
