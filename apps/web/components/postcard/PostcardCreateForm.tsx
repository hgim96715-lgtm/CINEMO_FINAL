"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCreatePostcard,
  useCreatePostcardQuoteSuggestion,
  usePublishPostcard,
  useUpdatePostcard,
} from "@/lib/queries/postcard.mutation";
import type { Postcard } from "@/lib/api/postcards";
import { DefaultValues, useForm } from "react-hook-form";
import {
  CreatePostcardFormValues,
  createPostcardSchema,
} from "@/schemas/postcard.schema";
import { PostcardReviewFields } from "@/components/postcard/fields/PostcardReviewFields";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { PostcardQuoteFields } from "@/components/postcard/fields/PostcardQuoteFields";
import { PostcardSceneFields } from "@/components/postcard/fields/PostcardSceneFields";

type PostcardCreateFormProps = {
  movieId: string;
  movieTitle: string;
  backgroundUrl?: string | null;
  backgroundType?: "BACKDROP" | "POSTER";
  postcard?: Postcard;
};

const postcardTypeOptions = [
  { value: "REVIEW", label: "감상" },
  { value: "QUOTE", label: "인용" },
  { value: "SCENE", label: "장면" },
] as const;

function getEmptyMetadata(
  type: CreatePostcardFormValues["type"],
): CreatePostcardFormValues["metadata"] {
  switch (type) {
    case "REVIEW":
      return {
        type: "REVIEW",
        title: null,
      };
    case "QUOTE":
      return {
        type: "QUOTE",
        title: null,
        originalLanguage: null,
        translations: [],
        isAiSuggested: false,
      };
    case "SCENE":
      return {
        type: "SCENE",
        sceneDescription: null,
        sceneTime: null,
      };
  }
}

function getFormMetadata(
  postcard?: Postcard,
): CreatePostcardFormValues["metadata"] {
  if (!postcard) {
    return null;
  }

  switch (postcard.type) {
    case "REVIEW":
      return {
        type: "REVIEW",
        title:
          postcard.metadata?.type === "REVIEW"
            ? (postcard.metadata.title ?? null)
            : null,
      };
    case "QUOTE":
      return {
        type: "QUOTE",
        title:
          postcard.metadata?.type === "QUOTE"
            ? (postcard.metadata.title ?? null)
            : null,
        originalLanguage:
          postcard.metadata?.type === "QUOTE"
            ? (postcard.metadata.originalLanguage ?? null)
            : null,
        translations:
          postcard.metadata?.type === "QUOTE"
            ? (postcard.metadata.translations ?? [])
            : [],
        isAiSuggested:
          postcard.metadata?.type === "QUOTE"
            ? (postcard.metadata.isAiSuggested ?? false)
            : false,
      };
    case "SCENE":
      return {
        type: "SCENE",
        sceneDescription:
          postcard.metadata?.type === "SCENE"
            ? (postcard.metadata.sceneDescription ?? null)
            : null,
        sceneTime:
          postcard.metadata?.type === "SCENE"
            ? (postcard.metadata.sceneTime ?? null)
            : null,
      };
  }
}

function getImageSource(url: string, type: "BACKDROP" | "POSTER") {
  const tmdbWidth = type === "BACKDROP" ? "w1280" : "w500";

  return url.replace(/\/t\/p\/(?:w\d+|original)\//, `/t/p/${tmdbWidth}/`);
}

export function PostcardCreateForm({
  movieId,
  movieTitle,
  backgroundUrl,
  backgroundType = "POSTER",
  postcard,
}: PostcardCreateFormProps) {
  const router = useRouter();
  const createMutation = useCreatePostcard();
  const updateMutation = useUpdatePostcard();
  const publishMutation = usePublishPostcard();
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [aiSuggestionError, setAiSuggestionError] = useState<string | null>(
    null,
  );
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const quoteSuggestionMutation = useCreatePostcardQuoteSuggestion();

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (!typeDropdownRef.current?.contains(target)) {
        setIsTypeOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setIsTypeOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const defaultValues = {
    movieId: postcard?.movieId ?? movieId,
    type: postcard?.type ?? ("REVIEW" as const),
    content: postcard?.content ?? "",
    visibility: postcard?.visibility ?? ("PRIVATE" as const),
    metadata: getFormMetadata(postcard),
    style: postcard?.style ?? {
      backgroundType: "POSTER" as const,
      textAlign: "LEFT" as const,
    },
    media:
      postcard?.media
        .filter((media) => media.type === "IMAGE")
        .map((media) => ({
          type: "IMAGE" as const,
          url: media.url,
          storageKey: media.storageKey,
          altText: media.altText,
          sortOrder: media.sortOrder,
        })) ?? [],
  } as DefaultValues<CreatePostcardFormValues>;

  const form = useForm<CreatePostcardFormValues>({
    resolver: zodResolver(createPostcardSchema),
    defaultValues,
  });

  const postcardType = form.watch("type");
  const postcardVisibility = form.watch("visibility");
  const postcardContent = form.watch("content");
  const postcardMetadata = form.watch("metadata");
  const postcardMedia = form.watch("media");
  const sceneMediaUrl =
    postcardType === "SCENE"
      ? (postcardMedia?.find((media) => media.type === "IMAGE")?.url ?? null)
      : null;
  const previewBackgroundUrl = sceneMediaUrl ?? backgroundUrl;
  const previewBackgroundType = sceneMediaUrl ? "POSTER" : backgroundType;
  const isEdit = postcard !== undefined;
  const isPublishedEdit = isEdit && postcard.status === "PUBLISHED";
  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    publishMutation.isPending;
  const quoteTranslation =
    postcardType === "QUOTE" && postcardMetadata?.type === "QUOTE"
      ? postcardMetadata.translations?.find(
          (translation) => translation.language === "ko",
        )?.content
      : undefined;
  const previewContent = postcardContent
    ? postcardType === "QUOTE"
      ? `“${postcardContent}”${quoteTranslation ? `\n\n${quoteTranslation}` : ""}`
      : postcardContent
    : {
        REVIEW: "이 영화를 보고 어떤 마음이 남았는지 적어보세요.",
        QUOTE: "기억하고 싶은 대사가 여기에 표시됩니다.",
        SCENE: "기억에 남은 장면이 여기에 표시됩니다.",
      }[postcardType];
  const handleSave = async (
    values: CreatePostcardFormValues,
    shouldPublish: boolean,
  ) => {
    // media는 사용자가 직접 첨부한 장면 이미지에만 사용함.
    // 기본 배경(backdrop/poster)은 movie.posterUrl fallback으로 표시함.
    const media = values.media?.length ? values.media : undefined;

    if (postcard) {
      const updatedPostcard = await updateMutation.mutateAsync({
        postcardId: postcard.id,
        request: {
          type: values.type,
          content: values.content,
          visibility: values.visibility,
          quoteSource: values.quoteSource ?? undefined,
          metadata: values.metadata,
          style: values.style,
          media,
          backgroundStyle: values.backgroundStyle,
          backgroundImageKey: values.backgroundImageKey,
        },
      });

      if (shouldPublish && updatedPostcard.status !== "PUBLISHED") {
        await publishMutation.mutateAsync(updatedPostcard.id);
      }
    } else {
      const createdPostcard = await createMutation.mutateAsync({
        ...values,
        quoteSource: values.quoteSource ?? undefined,
        media,
      });

      if (shouldPublish) {
        await publishMutation.mutateAsync(createdPostcard.id);
      }
    }

    router.push("/my-cinema?tab=postcards");
  };

  const handleRequestAiSuggestion = async () => {
    if (postcardType !== "QUOTE") {
      return;
    }

    setAiSuggestionError(null);

    try {
      const result = await quoteSuggestionMutation.mutateAsync({
        movieTitle,
      });

      if (
        !result.found ||
        !result.original ||
        !result.translation ||
        !result.sourceLanguage
      ) {
        throw new Error("확인 가능한 영화 문구를 찾지 못했습니다.");
      }

      const currentMetadata = form.getValues("metadata");

      form.setValue("content", result.original, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      form.setValue(
        "metadata",
        {
          type: "QUOTE",
          title:
            currentMetadata?.type === "QUOTE"
              ? (currentMetadata.title ?? null)
              : null,
          originalLanguage: result.sourceLanguage,
          translations: [
            {
              language: result.targetLanguage,
              content: result.translation,
              source: "AI",
            },
          ],
          isAiSuggested: result.isAiSuggested,
        },
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        },
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setAiSuggestionError(
        "AI 추천을 불러오지 못했습니다. 잠시 후 다시 시도해줘.",
      );
    }
  };

  return (
    <form className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:items-start">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 lg:sticky lg:top-8">
          <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-2xl bg-cinemo-bg p-6 sm:min-h-80">
            {previewBackgroundUrl && (
              <Image
                src={getImageSource(
                  previewBackgroundUrl,
                  previewBackgroundType,
                )}
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 62vw"
                className={
                  backgroundType === "BACKDROP"
                    ? "object-cover object-center"
                    : "object-contain object-center"
                }
              />
            )}
            <div className="absolute inset-0 bg-black/65" aria-hidden="true" />
            <p className="relative z-10 max-w-2xl whitespace-pre-wrap text-center text-lg leading-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {previewContent}
            </p>
          </div>
        </section>

        <section className="h-fit space-y-7 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-8">
          <div className="space-y-3">
            <label
              htmlFor="postcard-type"
              className="text-sm font-medium text-cinemo-gold"
            >
              엽서 유형
            </label>

            <div ref={typeDropdownRef} className="relative top-2">
              <button
                type="button"
                id="postcard-type"
                aria-haspopup="listbox"
                aria-expanded={isTypeOpen}
                onClick={() => {
                  setIsTypeOpen((isOpen) => !isOpen);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-white\/10 bg-cinemo-bg px-4 py-3 text-left text-sm text-cinemo-text outline-none transition focus:border-cinemo-gold"
              >
                <span>
                  {
                    postcardTypeOptions.find(
                      (option) => option.value === postcardType,
                    )?.label
                  }
                </span>
                <ChevronDown
                  className={
                    isTypeOpen
                      ? "size-4 rotate-180 text-cinemo-gold transition-transform"
                      : "size-4 text-cinemo-gold transition-transform"
                  }
                  aria-hidden="true"
                />
              </button>

              {isTypeOpen && (
                <div
                  role="listbox"
                  aria-labelledby="postcard-type"
                  className="absolute z-20 mt-2 max-h-52 w-full overflow-y-auto overscroll-contain rounded-xl border border-cinemo-gold\/40 bg-cinemo-bg p-1 shadow-xl shadow-black\/30"
                >
                  {postcardTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={postcardType === option.value}
                      onClick={() => {
                        form.setValue("type", option.value, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                        form.setValue(
                          "metadata",
                          getEmptyMetadata(option.value),
                          {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          },
                        );
                        setIsTypeOpen(false);
                      }}
                      className={
                        postcardType === option.value
                          ? "w-full rounded-lg bg-cinemo-gold\/15 px-3 py-2.5 text-left text-sm text-cinemo-gold transition"
                          : "w-full rounded-lg px-3 py-2.5 text-left text-sm text-cinemo-text transition hover:bg-white\/5"
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {postcardType === "REVIEW" ? (
            <PostcardReviewFields
              register={form.register}
              error={form.formState.errors.content?.message}
              contentLength={postcardContent.length}
            />
          ) : postcardType === "QUOTE" ? (
            <PostcardQuoteFields
              control={form.control}
              register={form.register}
              error={form.formState.errors.content?.message}
              aiError={aiSuggestionError ?? undefined}
              contentLength={postcardContent.length}
              onRequestAiSuggestion={handleRequestAiSuggestion}
            />
          ) : (
            <PostcardSceneFields
              control={form.control}
              register={form.register}
              error={form.formState.errors.content?.message}
              contentLength={postcardContent.length}
            />
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label
                htmlFor="postcard-visibility"
                className="text-sm font-medium text-cinemo-gold"
              >
                공개 범위
              </label>
              <span className="text-xs text-cinemo-muted">
                {postcardVisibility === "PUBLIC" ? "전체 공개" : "비공개"}
              </span>
            </div>

            <button
              type="button"
              id="postcard-visibility"
              role="switch"
              aria-checked={postcardVisibility === "PUBLIC"}
              onClick={() => {
                form.setValue(
                  "visibility",
                  postcardVisibility === "PUBLIC" ? "PRIVATE" : "PUBLIC",
                  {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  },
                );
              }}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-cinemo-bg px-4 py-3 text-left outline-none transition hover:border-cinemo-gold/50 focus:border-cinemo-gold"
            >
              <span className="text-sm text-cinemo-text">
                {postcardVisibility === "PUBLIC"
                  ? "공개 엽서 피드에 표시"
                  : "내 엽서에서만 표시"}
              </span>
              <span
                className={`relative h-6 w-11 rounded-full p-1 transition-colors ${
                  postcardVisibility === "PUBLIC"
                    ? "bg-cinemo-gold"
                    : "bg-white/20"
                }`}
                aria-hidden="true"
              >
                <span
                  className={`block size-4 rounded-full bg-white shadow-sm transition-transform ${
                    postcardVisibility === "PUBLIC"
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </span>
            </button>
          </div>
        </section>
      </div>

      <footer className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-white/15 px-5 py-3 text-sm text-cinemo-muted transition hover:bg-white/5"
        >
          취소
        </button>

        {!isPublishedEdit && (
          <button
            type="button"
            disabled={isSaving}
            onClick={form.handleSubmit((values) => handleSave(values, false))}
            className="rounded-xl border border-cinemo-gold/50 px-5 py-3 text-sm text-cinemo-gold transition hover:bg-cinemo-gold/10 disabled:opacity-50"
          >
            {isSaving ? "저장 중..." : "임시저장"}
          </button>
        )}

        <button
          type="button"
          disabled={isSaving}
          onClick={form.handleSubmit((values) => handleSave(values, true))}
          className="rounded-xl bg-cinemo-gold px-5 py-3 text-sm font-semibold text-cinemo-bg transition hover:bg-cinemo-gold-light disabled:opacity-50"
        >
          {isSaving
            ? "저장 중..."
            : !isEdit
              ? "엽서 저장"
              : isPublishedEdit
                ? "수정 완료"
                : "공개하기"}
        </button>
      </footer>
    </form>
  );
}
