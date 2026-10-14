"use client";

import { type ReactNode, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AppModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  showCloseButton?: boolean;
};

export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  showCloseButton = true,
}: AppModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(
          "rounded-2xl border-cinemo-gold/20 bg-[#102326]/95 text-cinemo-text shadow-xl shadow-black/25 sm:max-w-sm",
          className,
        )}
      >
        <DialogHeader
          className={cn("items-center text-center", showCloseButton && "pr-8")}
        >
          <DialogTitle className="text-center text-base font-semibold text-cinemo-gold-light">
            {title}
          </DialogTitle>

          {description && (
            <DialogDescription className="text-center leading-6 text-cinemo-muted">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children}

        {footer && (
          <DialogFooter className="-mx-4 -mb-4 flex-row items-center justify-center gap-2 border-white/10 bg-white/2 sm:flex-row sm:justify-center">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
