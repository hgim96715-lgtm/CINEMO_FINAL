"use client";

import {
  type Control,
  Controller,
  type UseFormRegister,
} from "react-hook-form";
import type { CreatePostcardFormValues } from "@/schemas/postcard.schema";

type PostcardQuoteFieldsProps = {
  control: Control<CreatePostcardFormValues>;
  register: UseFormRegister<CreatePostcardFormValues>;
  error?: string;
  aiError?: string;
  contentLength: number;
  onRequestAiSuggestion?: () => void | Promise<void>;
};
export function PostcardQuoteFields({
  control,
  register,
  error,
  aiError,
  contentLength,
  onRequestAiSuggestion,
}: PostcardQuoteFieldsProps) {
  return (
    <Controller
      control={control}
      name="metadata"
      render={({ field }) => {
        const quoteMetadata =
          field.value?.type === "QUOTE" ? field.value : null;
        const isAiSuggested = quoteMetadata?.isAiSuggested ?? false;
        const koreanTranslation =
          quoteMetadata?.translations?.find(
            (translation) => translation.language === "ko",
          )?.content ?? "";

        const updateQuoteMetadata = (next: {
          isAiSuggested?: boolean;
          koreanTranslation?: string;
        }) => {
          const translations = quoteMetadata?.translations ?? [];
          const nextTranslations = translations.filter(
            (translation) => translation.language !== "ko",
          );

          if (next.koreanTranslation?.trim()) {
            nextTranslations.push({
              language: "ko",
              content: next.koreanTranslation,
              source: "USER",
            });
          }

          field.onChange({
            type: "QUOTE",
            title: quoteMetadata?.title ?? null,
            originalLanguage: quoteMetadata?.originalLanguage ?? null,
            translations: nextTranslations,
            isAiSuggested: next.isAiSuggested ?? isAiSuggested,
          });
        };

        const handleAiSuggestedChange = () => {
          updateQuoteMetadata({ isAiSuggested: !isAiSuggested });
        };
        return (
          <section className="space-y-4 rounded-2xl border border-dashed border-white/15 p-5">
            <div>
              <p className="text-sm font-medium text-cinemo-gold">
                기억하고 싶은 인용구
              </p>

              <p className="mt-1 text-xs text-cinemo-muted">
                영화 속 문장이나 대사를 남겨보세요.
              </p>
            </div>

            <div className="space-y-3">
              <label
                htmlFor="quote-content"
                className="block text-xs font-medium text-cinemo-muted"
              >
                원문
              </label>
              <textarea
                id="quote-content"
                {...register("content")}
                rows={5}
                maxLength={5000}
                placeholder="기억하고 싶은 영화 속 문장이나 대사를 적어보세요."
                className="w-full resize-none rounded-xl border border-white\/10 bg-cinemo-bg p-4 text-sm leading-7 outline-none placeholder:text-cinemo-muted focus:border-cinemo-gold"
              />
            </div>

            <div className="flex justify-between text-xs text-cinemo-muted">
              <span>{error}</span>
              <span>{contentLength}/5000</span>
            </div>

            <div className="space-y-3">
              <label
                htmlFor="quote-translation"
                className="block text-xs font-medium text-cinemo-muted"
              >
                한국어 번역
              </label>
              <textarea
                id="quote-translation"
                value={koreanTranslation}
                onChange={(event) =>
                  updateQuoteMetadata({
                    koreanTranslation: event.target.value,
                  })
                }
                rows={5}
                maxLength={5000}
                placeholder="원문의 한국어 번역을 적어보세요."
                className="w-full resize-none rounded-xl border border-white\/10 bg-cinemo-bg p-4 text-sm leading-7 outline-none placeholder:text-cinemo-muted focus:border-cinemo-gold"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <label
                htmlFor="quote-ai-suggested"
                className="flex cursor-pointer items-center gap-2 text-sm text-cinemo-text"
              >
                <input
                  id="quote-ai-suggested"
                  type="checkbox"
                  checked={isAiSuggested}
                  onChange={handleAiSuggestedChange}
                  className="size-4 accent-cinemo-gold"
                />
                AI 추천 문장
              </label>

              <button
                type="button"
                onClick={() => {
                  void onRequestAiSuggestion?.();
                }}
                className="rounded-lg border border-cinemo-gold/50 px-3 py-2 text-xs text-cinemo-gold transition hover:bg-cinemo-gold/10"
              >
                AI 추천받기
              </button>
            </div>

            {aiError && (
              <p className="text-xs text-red-300" role="alert">
                {aiError}
              </p>
            )}
          </section>
        );
      }}
    />
  );
}
