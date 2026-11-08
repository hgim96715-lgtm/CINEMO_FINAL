"use client";

import { ChevronRight, Home, List, Mail, Menu, Orbit, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const items = [
  { href: "/lobby", label: "홈", icon: Home },
  { href: "/lobby/lists", label: "리스트", icon: List },
  { href: "/lobby/postcards", label: "엽서", icon: Mail },
  { href: "/my-cinema", label: "내 시네마", icon: UserRound },
  { href: "/my-universe", label: "내 우주", icon: Orbit },
] as const;

export function MobileNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  if (pathname.startsWith("/admin") || ["/login", "/signup", "/register"].includes(pathname)) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="주요 메뉴 열기"
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-cinemo-gold-light transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-cinemo-gold lg:hidden"
      >
        <Menu size={24} />
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="border-white/10 bg-cinemo-bg-deep px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
      >
        <div className="flex items-center justify-between">
          <SheetTitle className="px-2 text-lg font-semibold text-cinemo-text">CINEMO 메뉴</SheetTitle>
          <SheetClose
            aria-label="메뉴 닫기"
            className="flex size-11 items-center justify-center rounded-full text-cinemo-muted hover:bg-white/10"
          >
            <X size={22} />
          </SheetClose>
        </div>
        <nav aria-label="모바일 웹 주요 메뉴" className="grid gap-1 overflow-y-auto">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/lobby" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition",
                  active
                    ? "bg-cinemo-gold/15 text-cinemo-gold-light"
                    : "text-cinemo-text hover:bg-white/5",
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
                <span className="flex-1">{label}</span>
                <ChevronRight aria-hidden="true" className="size-4 text-cinemo-muted" />
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
