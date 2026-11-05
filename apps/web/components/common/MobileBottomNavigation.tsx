"use client";

import {Home, Mail, Orbit, Search, UserRound} from "lucide-react";
import Link from "next/link";
import {usePathname} from "next/navigation";

import {cn} from "@/lib/utils";
import {useSearchStore} from "@/stores/search.store";

const items = [
  {href: "/lobby", label: "홈", icon: Home},
  {href: "/lobby/postcards", label: "엽서", icon: Mail},
  {href: "/my-cinema", label: "내 시네마", icon: UserRound},
  {href: "/my-universe", label: "내 우주", icon: Orbit},
] as const;

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const openSearch = useSearchStore((state) => state.openSearch);

  if (
    pathname.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/signup"
  ) {
    return null;
  }

  const isActive = (href: string) =>
    href === "/lobby"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="모바일 주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-cinemo-bg-deep/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {items.slice(0, 1).map((item) => (
          <MobileNavigationLink key={item.href} {...item} active={isActive(item.href)} />
        ))}

        <button
          type="button"
          aria-label="영화 검색 열기"
          onClick={openSearch}
          className="flex min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-xs text-cinemo-muted transition hover:bg-white/5 hover:text-cinemo-gold-light"
        >
          <Search className="size-5" strokeWidth={1.8} />
          <span>검색</span>
        </button>

        {items.slice(1).map((item) => (
          <MobileNavigationLink key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </div>
    </nav>
  );
}

function MobileNavigationLink({
  href,
  label,
  icon: Icon,
  active,
}: (typeof items)[number] & {active: boolean}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-xs transition",
        active
          ? "bg-cinemo-gold/15 text-cinemo-gold-light"
          : "text-cinemo-muted hover:bg-white/5 hover:text-cinemo-text",
      )}
    >
      <Icon className="size-5" strokeWidth={1.8} />
      <span>{label}</span>
    </Link>
  );
}
