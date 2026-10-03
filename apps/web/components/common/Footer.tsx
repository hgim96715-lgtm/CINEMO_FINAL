import { CINEMO_BRAND } from "@cinemo/shared";
import { Camera, Mail, MessageCircle, Play } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-0 bg-cinemo-bg-deep/70 px-6 py-10 text-sm text-muted-foreground sm:px-10 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-5">
          <a
            href="mailto:hello@cinemo.app"
            aria-label="CINEMO 이메일"
            className="transition-colors hover:text-primary"
          >
            <Mail className="size-5" />
          </a>
          <a
            href="/"
            aria-label="CINEMO Instagram"
            className="transition-colors hover:text-primary"
          >
            <Camera className="size-5" />
          </a>
          <a
            href="/"
            aria-label="CINEMO YouTube"
            className="transition-colors hover:text-primary"
          >
            <Play className="size-5" />
          </a>
          <a
            href="/"
            aria-label="CINEMO 문의"
            className="transition-colors hover:text-primary"
          >
            <MessageCircle className="size-5" />
          </a>
        </div>

        <nav className="mt-7 grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
          <a href="/" className="transition-colors hover:text-foreground">
            CINEMO 소개
          </a>
          <a href="/" className="transition-colors hover:text-foreground">
            이용 약관
          </a>
          <a href="/" className="transition-colors hover:text-foreground">
            개인정보 처리방침
          </a>
          <a href="/" className="transition-colors hover:text-foreground">
            문의하기
          </a>
        </nav>

        <div className="mt-8 space-y-1 text-xs leading-5 text-muted-foreground/80">
          <p className="font-semibold tracking-[0.18em] text-foreground">
            {CINEMO_BRAND.name}
          </p>
          <p>{CINEMO_BRAND.description}</p>
          <p>영화 정보와 장면을 기록하는 CINEMO</p>
          <p>© {new Date().getFullYear()} CINEMO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
