"use client";

import { useState } from "react";
import { Play } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTrailerEmbedUrl } from "@/lib/media/trailer";

type TrailerMedia = {
  sourceProvider: string;
  externalId: string | null;
};

type MovieTrailerButtonProps = {
  title: string;
  trailer: TrailerMedia | null;
};

export function MovieTrailerButton({
  title,
  trailer,
}: MovieTrailerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const trailerEmbedUrl = getTrailerEmbedUrl(trailer);

  if (!trailerEmbedUrl) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="예고편 보기"
        title="예고편 보기"
        className="group inline-flex h-11 w-11 items-center justify-center gap-0 rounded-xl border border-white/20 bg-white/5 px-0 py-0 font-semibold text-cinemo-text backdrop-blur transition hover:border-cinemo-gold/50 hover:bg-white/10 active:bg-cinemo-gold/15 sm:h-auto sm:w-auto sm:gap-2 sm:px-5 sm:py-3"
      >
        <Play
          className={`size-4 transition-[color,transform] group-hover:scale-110 group-hover:text-cinemo-gold group-active:text-cinemo-gold ${isOpen ? "text-cinemo-gold" : "text-cinemo-muted"}`}
          fill="currentColor"
        />
        <span className="hidden sm:inline">예고편</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] overflow-hidden border-0 bg-black p-0 sm:w-[calc(100%-3rem)] sm:max-w-5xl">
          <DialogTitle className="sr-only">{title} 예고편</DialogTitle>

          <DialogDescription className="sr-only">
            {title} 영화 예고편
          </DialogDescription>

          <div className="aspect-video w-full">
            <iframe
              src={trailerEmbedUrl}
              title={`${title} 예고편`}
              className="h-full w-full"
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
