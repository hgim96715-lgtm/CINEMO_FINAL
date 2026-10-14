"use client";

import {
  type Control,
  Controller,
  type UseFormRegister,
} from "react-hook-form";

import type { CreatePostcardFormValues } from "@/schemas/postcard.schema";

type PostcardSceneFieldsProps = {
  control: Control<CreatePostcardFormValues>;
  register: UseFormRegister<CreatePostcardFormValues>;
  error?: string;
  contentLength: number;
};

export function PostcardSceneFields({
  control,
  register,
  error,
  contentLength,
}: PostcardSceneFieldsProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-dashed border-white/15 p-5">
      <div>
        <p className="text-sm font-medium text-cinemo-gold">기억에 남은 장면</p>
        <p className="mt-1 text-xs text-cinemo-muted">
          장면에 대한 기억과 영화 속 위치를 남겨보세요.
        </p>
      </div>

      <div className="space-y-3">
        <label
          htmlFor="scene-content"
          className="block text-xs font-medium text-cinemo-gold"
        >
          장면 설명
        </label>

        <textarea
          id="scene-content"
          {...register("content")}
          rows={6}
          maxLength={5000}
          placeholder="어떤 장면이 기억에 남았는지 적어보세요."
          className="w-full resize-none rounded-xl border border-white/10 bg-cinemo-bg p-4 text-sm leading-7 text-cinemo-text outline-none placeholder:text-cinemo-muted/45 focus:border-cinemo-gold"
        />

        <div className="flex justify-between text-xs text-cinemo-muted">
          <span>{error}</span>
          <span>{contentLength}/5000</span>
        </div>
      </div>

      <Controller
        control={control}
        name="metadata"
        render={({ field }) => {
          const sceneMetadata =
            field.value?.type === "SCENE" ? field.value : null;

          return (
            <div className="space-y-3">
              <label
                htmlFor="scene-time"
                className="block text-xs font-medium text-cinemo-gold"
              >
                장면 위치
              </label>

              <input
                id="scene-time"
                type="text"
                value={sceneMetadata?.sceneTime ?? ""}
                onChange={(event) => {
                  field.onChange({
                    type: "SCENE",
                    sceneDescription: sceneMetadata?.sceneDescription ?? null,
                    sceneTime: event.target.value || null,
                  });
                }}
                placeholder="예: 01:12:30 또는 영화 초반부"
                className="w-full rounded-xl border border-white\/10 bg-cinemo-bg px-4 py-3 text-sm  outline-none placeholder:text-cinemo-muted/45 focus:border-cinemo-gold"
              />
            </div>
          );
        }}
      />

      <Controller
        control={control}
        name="media"
        render={({ field }) => {
          const media = field.value ?? [];

          const getMediaUrl = () =>
            media.find((item) => item.type === "IMAGE")?.url ?? "";

          const updateMediaUrl = (value: string) => {
            const nextMedia = media.filter((item) => item.type !== "IMAGE");
            const url = value.trim();

            if (url) {
              nextMedia.push({
                type: "IMAGE",
                url,
                storageKey: null,
                altText: null,
                sortOrder: nextMedia.length,
              });
            }

            field.onChange(nextMedia);
          };

          return (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-cinemo-gold">장면 이미지</p>
                <p className="mt-1 text-xs text-cinemo-muted">
                  이미지 업로드 연동 전까지 URL로 첨부할 수 있어요.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="scene-image-url"
                  className="block text-xs text-cinemo-gold"
                >
                  장면 이미지 URL
                </label>

                <input
                  id="scene-image-url"
                  type="url"
                  value={getMediaUrl()}
                  onChange={(event) => updateMediaUrl(event.target.value)}
                  placeholder="https://example.com/scene-image.jpg"
                  className="w-full rounded-xl border border-white\/10 bg-cinemo-bg px-4 py-3 text-sm  outline-none placeholder:text-cinemo-muted/45 focus:border-cinemo-gold"
                />
              </div>
            </div>
          );
        }}
      />
    </section>
  );
}
