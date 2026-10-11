"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {Search, UserRound, X} from "lucide-react";
import {usePathname, useRouter} from "next/navigation";
import {useForm} from "react-hook-form";
import {CINEMO_BRAND} from "@cinemo/shared";
import {moiveSearchSchema, MovieSearchFormValues,} from "../../schemas/movie-search.schema";
import {useSearchStore} from "@/stores/search.store";
import Image from "next/image";
import Link from "next/link";
import cinemoLogo from "@/app/icon.png";
import {useCallback, useEffect, useRef, useState} from "react";
import {MovieSearchSuggestions} from "../movies/MovieSearchSuggestions";
import {cn} from "@/lib/utils";
import {useAuthStore} from "@/stores/auth.store";
import {logout as logoutRequest} from "@/lib/api/auth";

export function Header() {
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isLobby = pathname === "/lobby";
  const isSearchOpen = useSearchStore((state) => state.isSearchOpen);
  const openSearch = useSearchStore((state) => state.openSearch);
  const closeSearch = useSearchStore((state) => state.closeSearch);
  const searchRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const { register, handleSubmit, reset, setValue, watch } =
    useForm<MovieSearchFormValues>({
      resolver: zodResolver(moiveSearchSchema),
      defaultValues: {
        query: "",
      },
    });

  const query = watch("query");

  const resetSearchForm = useCallback(() => {
    reset(
      { query: "" },
      {
        keepErrors: false,
        keepIsSubmitted: false,
        keepSubmitCount: false,
      },
    );
    closeSearch();
  }, [closeSearch, reset]);

  useEffect(() => {
    resetSearchForm();
  }, [pathname, resetSearchForm]);

  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!searchRef.current?.contains(target)) {
        resetSearchForm();
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [resetSearchForm]);

  const onSubmit = (values: MovieSearchFormValues) => {
    const query = values.query.trim();
    resetSearchForm();
    router.push(`/lobby/movies?query=${encodeURIComponent(query)}`);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutRequest();
    } finally {
      clearUser();
      router.replace("/lobby");
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-transparent transition-[background-color,box-shadow,backdrop-filter] duration-200",
        isScrolled &&
          "bg-cinemo-bg-deep/82 shadow-[0_0.5rem_1.5rem_rgb(0_0_0_/20%)] backdrop-blur-lg",
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-22 w-full items-center px-4",
          isLobby
            ? "max-w-[120rem] gap-4 sm:px-6 lg:px-10"
            : "max-w-6xl gap-8 px-6",
        )}
      >
        <Link
          href="/lobby"
          onClick={resetSearchForm}
          aria-label={CINEMO_BRAND.name}
          className="flex shrink-0 items-center"
        >
          <Image
            src={cinemoLogo}
            alt="CINEMO"
            width={44}
            height={44}
            priority
            className="h-11 w-11 object-contain"
          />
        </Link>

        <div
          ref={searchRef}
          className="relative ml-auto md:mx-auto md:flex md:flex-1 md:justify-center"
        >
          <button
            type="button"
            aria-label="영화 검색 열기"
            aria-expanded={isSearchOpen}
            onClick={() => {
              resetSearchForm();
              openSearch();
            }}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full text-cinemo-gold-light transition hover:bg-white/10 hover:text-cinemo-gold md:hidden",
              isSearchOpen && "bg-white/10 text-cinemo-gold",
            )}
          >
            <Search size={24} />
          </button>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className={cn(
              "fixed inset-0 z-50 flex min-h-screen flex-col bg-cinemo-bg/96 p-4 text-cinemo-text shadow-2xl backdrop-blur-xl md:relative md:min-h-0 md:w-[min(42rem,52vw)] md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none",
              !isSearchOpen && "hidden md:flex",
            )}
          >
            <div className="mb-4 flex items-center gap-3 md:hidden">
              <button
                type="button"
                aria-label="검색 닫기"
                onClick={resetSearchForm}
                className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X size={24} />
              </button>

              <span className="text-base font-semibold">영화 검색</span>
            </div>

            <div className="flex h-12 items-center rounded-lg border border-cinemo-gold/30 bg-transparent px-4 transition-colors focus-within:border-cinemo-gold/60 focus-within:bg-white/5 md:h-14">
              <input
                {...register("query")}
                autoFocus
                type="text"
                placeholder="영화 검색"
                aria-label="영화 검색"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-white/40 md:text-lg"
              />

              {query.trim() && (
                <button
                  type="button"
                  aria-label="검색어 지우기"
                  onClick={() => {
                    setValue("query", "");
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}

              <button
                type="submit"
                aria-label="검색"
                className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-cinemo-gold-light transition hover:bg-white/10 hover:text-cinemo-text "
              >
                <Search size={20} />
              </button>
            </div>

            <div
              className={cn(
                "empty:hidden scroll-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden mt-4 flex-1 overflow-y-auto md:absolute md:left-0 md:right-0 md:top-16 md:z-50 md:max-h-112 md:overflow-y-auto md:rounded-2xl md:bg-cinemo-bg/96 md:p-3 md:shadow-2xl md:backdrop-blur-xl",
                !query.trim() && "md:hidden",
              )}
            >
              <MovieSearchSuggestions query={query} />
            </div>
          </form>
        </div>
        {user ? (
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/my-cinema"
              aria-label="MY CINEMA"
              className="flex items-center gap-2 text-sm text-cinemo-text transition hover:text-cinemo-gold-light"
            >
              <span className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-cinemo-gold/50 bg-white/5">
                {user.profileImageUrl ? (
                  <Image
                    src={user.profileImageUrl}
                    alt=""
                    width={36}
                    height={36}
                    className="size-full object-cover"
                  />
                ) : (
                  <UserRound className="size-5" />
                )}
              </span>

              <span className="hidden max-w-24 truncate sm:inline">
                {user.nickname}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-sm text-cinemo-muted transition hover:text-cinemo-gold-light disabled:opacity-50"
            >
              {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="shrink-0 text-sm text-cinemo-muted transition hover:text-cinemo-gold-light"
          >
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
