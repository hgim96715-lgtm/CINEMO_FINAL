"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type CinemaSelectOption = {
  value: string;
  label: string;
};

type CinemaSelectProps = {
  value: string;
  options: CinemaSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
};

export function CinemaSelect({
  value,
  options,
  onChange,
  ariaLabel,
}: CinemaSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full sm:w-[22rem]">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={`flex h-12 w-full items-center justify-between rounded-[1.1rem] border bg-[#16282a]/95 px-4 text-left text-base font-semibold text-cinemo-text shadow-[inset_0_1px_0_rgb(255_255_255_/_4%)] outline-none transition ${
          isOpen
            ? "border-cinemo-gold ring-2 ring-cinemo-gold/20"
            : "border-[#385154] hover:border-cinemo-gold/60"
        }`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown
          size={23}
          strokeWidth={1.8}
          aria-hidden="true"
          className={`ml-3 shrink-0 transition-transform ${
            isOpen ? "rotate-180 text-cinemo-gold" : "text-cinemo-text"
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="scrollbar-none absolute left-0 top-[calc(100%+0.5rem)] z-50 max-h-64 w-full overflow-y-auto rounded-2xl border border-[#385154] bg-[#132528] p-2 shadow-[0_18px_40px_rgb(0_0_0_/_35%)]"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex min-h-10 w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                  isSelected
                    ? "bg-cinemo-gold/15 text-cinemo-gold-light"
                    : "text-cinemo-text hover:bg-white/8 hover:text-cinemo-gold-light"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={17} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
