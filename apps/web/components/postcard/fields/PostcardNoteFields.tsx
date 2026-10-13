"use client";

import {
  type Control,
  Controller,
  type UseFormRegister,
} from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { CreatePostcardFormValues } from "@/schemas/postcard.schema";

type PostcardNoteFieldsProps = {
  control: Control<CreatePostcardFormValues>;
  register: UseFormRegister<CreatePostcardFormValues>;
  error?: string;
  contentLength: number;
};

const venueOptions = [
  { value: "HOME", label: "집" },
  { value: "THEATER", label: "극장" },
  { value: "OTHER", label: "기타" },
] as const;

const companionOptions = [
  { value: "ALONE", label: "혼자" },
  { value: "FRIEND", label: "친구" },
  { value: "FAMILY", label: "가족" },
  { value: "PARTNER", label: "연인" },
  { value: "OTHER", label: "기타" },
] as const;

export function PostcardNoteFields({
  control,
  register,
  error,
  contentLength,
}: PostcardNoteFieldsProps) {
  const [openDropdown, setOpenDropdown] = useState<
    "venue" | "companion" | null
  >(null);
  const dropdownAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (target instanceof Node && !dropdownAreaRef.current?.contains(target)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <section className="space-y-5 rounded-2xl border border-dashed border-white/15 p-5">
      <div>
        <p className="text-sm font-medium text-cinemo-gold">영화 기록</p>
        <p className="mt-1 text-xs text-cinemo-muted">
          영화를 언제, 어디서, 누구와 봤는지 남겨보세요.
        </p>
      </div>

      <div className="space-y-3">
        <label
          htmlFor="note-content"
          className="block text-xs font-medium text-cinemo-muted"
        >
          기록 내용
        </label>

        <textarea
          id="note-content"
          {...register("content")}
          rows={6}
          maxLength={5000}
          placeholder="영화를 본 날의 기억을 남겨보세요."
          className="w-full resize-none rounded-xl border border-white\/10 bg-cinemo-bg p-4 text-sm leading-7 outline-none placeholder:text-cinemo-muted focus:border-cinemo-gold"
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
          const noteMetadata =
            field.value?.type === "NOTE" ? field.value : null;

          const updateMetadata = (
            values: Partial<{
              venueType: "HOME" | "THEATER" | "OTHER" | null;
              venueName: string | null;
              companionType:
                "ALONE" | "FRIEND" | "FAMILY" | "PARTNER" | "OTHER" | null;
              companionName: string | null;
              watchedAt: string | null;
            }>,
          ) => {
            field.onChange({
              type: "NOTE",
              venueType: noteMetadata?.venueType ?? null,
              venueName: noteMetadata?.venueName ?? null,
              companionType: noteMetadata?.companionType ?? null,
              companionName: noteMetadata?.companionName ?? null,
              watchedAt: noteMetadata?.watchedAt ?? null,
              ...values,
            });
          };

          return (
            <div
              ref={dropdownAreaRef}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="space-y-2">
                <label
                  htmlFor="note-watched-at"
                  className="block text-xs font-medium text-cinemo-muted"
                >
                  본 날짜
                </label>

                <input
                  id="note-watched-at"
                  type="date"
                  value={noteMetadata?.watchedAt ?? ""}
                  onChange={(event) =>
                    updateMetadata({
                      watchedAt: event.target.value || null,
                    })
                  }
                  className="w-full rounded-xl border border-white\/10 bg-cinemo-bg px-4 py-3 text-sm text-cinemo-text outline-none focus:border-cinemo-gold"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="note-venue-type"
                  className="block text-xs font-medium text-cinemo-muted"
                >
                  관람 장소
                </label>

                <div className="relative">
                  <button
                    type="button"
                    id="note-venue-type"
                    aria-haspopup="listbox"
                    aria-expanded={openDropdown === "venue"}
                    onClick={() =>
                      setOpenDropdown((current) =>
                        current === "venue" ? null : "venue",
                      )
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-white\/10 bg-cinemo-bg px-4 py-3 text-left text-sm text-cinemo-text outline-none transition focus:border-cinemo-gold"
                  >
                    <span>
                      {venueOptions.find(
                        (option) => option.value === noteMetadata?.venueType,
                      )?.label ?? "선택 안 함"}
                    </span>
                    <ChevronDown
                      className={`size-4 text-cinemo-gold transition-transform ${
                        openDropdown === "venue" ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {openDropdown === "venue" && (
                    <div
                      role="listbox"
                      aria-labelledby="note-venue-type"
                      className="absolute z-20 mt-2 w-full rounded-xl border border-cinemo-gold\/40 bg-cinemo-bg p-1 shadow-xl shadow-black\/30"
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={!noteMetadata?.venueType}
                        onClick={() => {
                          updateMetadata({ venueType: null });
                          setOpenDropdown(null);
                        }}
                        className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-cinemo-muted transition hover:bg-white\/5"
                      >
                        선택 안 함
                      </button>

                      {venueOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={
                            noteMetadata?.venueType === option.value
                          }
                          onClick={() => {
                            updateMetadata({ venueType: option.value });
                            setOpenDropdown(null);
                          }}
                          className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-white\/5 ${
                            noteMetadata?.venueType === option.value
                              ? "bg-cinemo-gold\/15 text-cinemo-gold"
                              : "text-cinemo-text"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="note-venue-name"
                  className="block text-xs font-medium text-cinemo-muted"
                >
                  장소 이름
                </label>

                <input
                  id="note-venue-name"
                  value={noteMetadata?.venueName ?? ""}
                  onChange={(event) =>
                    updateMetadata({
                      venueName: event.target.value || null,
                    })
                  }
                  placeholder="예: 메가박스 코엑스"
                  className="w-full rounded-xl border border-white\/10 bg-cinemo-bg px-4 py-3 text-sm  outline-none placeholder:text-cinemo-muted focus:border-cinemo-gold"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="note-companion-type"
                  className="block text-xs font-medium text-cinemo-muted"
                >
                  함께 본 사람
                </label>

                <div className="relative">
                  <button
                    type="button"
                    id="note-companion-type"
                    aria-haspopup="listbox"
                    aria-expanded={openDropdown === "companion"}
                    onClick={() =>
                      setOpenDropdown((current) =>
                        current === "companion" ? null : "companion",
                      )
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-white\/10 bg-cinemo-bg px-4 py-3 text-left text-sm text-cinemo-text outline-none transition focus:border-cinemo-gold"
                  >
                    <span>
                      {companionOptions.find(
                        (option) =>
                          option.value === noteMetadata?.companionType,
                      )?.label ?? "선택 안 함"}
                    </span>
                    <ChevronDown
                      className={`size-4 text-cinemo-gold transition-transform ${
                        openDropdown === "companion" ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {openDropdown === "companion" && (
                    <div
                      role="listbox"
                      aria-labelledby="note-companion-type"
                      className="absolute z-20 mt-2 w-full rounded-xl border border-cinemo-gold\/40 bg-cinemo-bg p-1 shadow-xl shadow-black\/30"
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={!noteMetadata?.companionType}
                        onClick={() => {
                          updateMetadata({ companionType: null });
                          setOpenDropdown(null);
                        }}
                        className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-cinemo-muted transition hover:bg-white\/5"
                      >
                        선택 안 함
                      </button>

                      {companionOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={
                            noteMetadata?.companionType === option.value
                          }
                          onClick={() => {
                            updateMetadata({ companionType: option.value });
                            setOpenDropdown(null);
                          }}
                          className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-white\/5 ${
                            noteMetadata?.companionType === option.value
                              ? "bg-cinemo-gold\/15 text-cinemo-gold"
                              : "text-cinemo-text"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }}
      />
    </section>
  );
}
