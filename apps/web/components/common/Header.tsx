"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { CINEMO_BRAND } from "@cinemo/shared";
import {
  moiveSearchSchema,
  MovieSearchFormValues,
} from "../../schemas/movie-search.schema";
import { useSearchStore } from "@/stores/search.store";
import Image from "next/image";
import Link from "next/link";
import cinemoLogo from "@/app/icon.png";
import { useEffect, useRef, useState } from "react";
import { MovieSearchSuggestions } from "../movies/MovieSearchSuggestions";
import { cn } from "@/lib/utils";

export function Header() {
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<MovieSearchFormValues>({
    resolver: zodResolver(moiveSearchSchema),
    defaultValues: {
      query: "",
    },
  });

  const query = watch("query");

  useEffect(() => {
    reset({ query: "" });
    closeSearch();
  }, [pathname, reset, closeSearch]);

  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!searchRef.current?.contains(target)) {
        reset({ query: "" });
        closeSearch();
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [reset, closeSearch]);

  const onSubmit = (values: MovieSearchFormValues) => {
    const query = values.query.trim();
    reset({ query: "" });
    closeSearch();
    router.push(`/lobby/movies?query=${encodeURIComponent(query)}`);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full backdrop-blur-lg transition-[background-color,box-shadow] duration-200",
        isLobby ? "bg-[#171412]/55" : "bg-[#171412]/88",
        isScrolled &&
          "bg-[#171412]/94 shadow-[0_0.5rem_1.5rem_rgb(0_0_0_/20%)]",
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
          onClick={() => {
            reset({ query: "" });
            closeSearch();
          }}
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

        <div ref={searchRef} className="relative ml-auto">
          <button
            type="button"
            aria-label="영화 검색 열기"
            aria-expanded={isSearchOpen}
            onClick={openSearch}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white ",
              isSearchOpen && "bg-white/10 text-white",
            )}
          >
            <Search size={24} />
          </button>

          {isSearchOpen && (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="fixed inset-0 z-50 flex min-h-screen flex-col bg-[#171412]/95 p-4 text-[#f3efe6] shadow-2xl backdrop-blur-xl md:absolute md:inset-auto md:right-0 md:top-14 md:min-h-0 md:w-[min(22rem,calc(100vw-2rem))] md:rounded-2xl md:border md:border-white/10 md:p-3"
            >
              <div className="mb-4 flex items-center gap-3 md:hidden">
                <button
                  type="button"
                  aria-label="검색 닫기"
                  onClick={() => {
                    reset({ query: "" });
                    closeSearch();
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={24} />
                </button>

                <span className="text-base font-semibold">영화 검색</span>
              </div>

              <div className="flex h-12 items-center rounded-full border border-white/10 bg-black/35 px-4 focus-within:border-[#d4b56a]/60">
                <input
                  {...register("query")}
                  autoFocus
                  type="text"
                  placeholder="영화 검색"
                  aria-label="영화 검색"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-white/40"
                />

                {query.trim() && (
                  <button
                    type="button"
                    aria-label="검색어 지우기"
                    onClick={() => setValue("query", "")}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                )}

                <button
                  type="submit"
                  aria-label="검색"
                  className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-[#d4b56a] transition hover:bg-white/10 hover:text-[#f3efe6] "
                >
                  <Search size={20} />
                </button>
              </div>

              <div className="mt-4 flex-1 overflow-y-auto">
                <MovieSearchSuggestions query={query} />
              </div>
            </form>
          )}

          {errors.query && (
            <p className="mt-2 px-4 text-sm text-red-400">
              {errors.query.message}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
