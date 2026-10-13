"use client";

import type { UseFormRegister } from "react-hook-form";
import type { CreatePostcardFormValues } from "@/schemas/postcard.schema";

type PostcardReviewFieldsProps = {
  register: UseFormRegister<CreatePostcardFormValues>;
  error?: string;
  contentLength: number;
};

export function PostcardReviewFields({
  register,
  error,
  contentLength,
}: PostcardReviewFieldsProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-dashed border-white/15 p-5">
      <div>
        <p className="text-sm font-medium text-cinemo-gold">감상 후기</p>
        <p className="mt-1 text-xs text-cinemo-muted">
          이 영화를 보고 어떤 마음이 남았는지 적어보세요.
        </p>
      </div>

      <textarea
        id="review-content"
        {...register("content")}
        rows={8}
        maxLength={5000}
        placeholder="영화를 보고 난 뒤의 감상을 남겨보세요."
        className="w-full resize-none rounded-xl border border-white/10 bg-cinemo-bg p-4 text-sm leading-7 text-cinemo-text outline-none placeholder:text-cinemo-muted focus:border-cinemo-gold"
      />

      <div className="flex justify-between text-xs text-cinemo-muted">
        <span>{error}</span>
        <span>{contentLength}/5000</span>
      </div>
    </section>
  );
}
