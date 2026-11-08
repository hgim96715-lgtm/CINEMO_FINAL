import { CINEMO_BRAND } from "@cinemo/shared";
import { Mail } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-0 border-t border-white/10 bg-cinemo-bg-deep/70 px-6 py-8 text-sm text-muted-foreground sm:px-10 sm:py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="font-semibold tracking-[0.18em] text-cinemo-gold">
            {CINEMO_BRAND.name}
          </p>
          <p className="text-xs leading-5 text-muted-foreground/80">
            {CINEMO_BRAND.description}
          </p>
          <p className="text-xs leading-5 text-muted-foreground/60">
            영화 정보와 장면을 기록하는 CINEMO
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <a
            href="mailto:hello_cinemo@icloud.com"
            className="inline-flex items-center gap-2 text-xs text-cinemo-muted transition-colors hover:text-cinemo-gold-light"
          >
            <Mail className="size-4" />
            문의하기
          </a>
          <div className="flex flex-wrap gap-3 text-xs text-cinemo-muted">
            <Link href="/terms" className="hover:underline">서비스 이용약관</Link>
            <Link href="/privacy" className="hover:underline">개인정보 처리방침</Link>
          </div>
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} CINEMO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
