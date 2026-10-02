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
import { useEffect, useRef } from "react";
import { MovieSearchSuggestions } from "../movies/MovieSearchSuggestions";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isSearchOpen = useSearchStore((state) => state.isSearchOpen);
  const openSearch = useSearchStore((state) => state.openSearch);
  const closeSearch = useSearchStore((state) => state.closeSearch);
  const searchRef = useRef<HTMLFormElement>(null);

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
    <header className="border-b border-white/10 bg-[#151515]">
      <div className="mx-auto flex h-20 max-w-6xl items-center gap-8 px-6">
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

        <form
          ref={searchRef}
          onSubmit={handleSubmit(onSubmit)}
          className="relative w-full max-w-xl"
        >
          <div className="flex h-12 items-center rounded-full border border-white/15 bg-[#111] pl-5 pr-1 shadow-lg">
            <input
              {...register("query")}
              type="text"
              placeholder="검색"
              aria-label="영화 검색"
              onFocus={openSearch}
              autoComplete="off"
              className="h-full min-w-0 flex-1 bg-transparent text-lg text-[#f3efe6] outline-none placeholder:text-white/40"
            />

            {query.trim() && (
              <button
                type="button"
                aria-label="검색어 지우기"
                onClick={() => {
                  setValue("query", "");
                  openSearch();
                }}
                className="mr-2 flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            )}

            <button
              type="submit"
              aria-label="검색"
              className="flex h-10 w-14 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <Search size={24} strokeWidth={2} />
            </button>
          </div>

          {errors.query && (
            <p className="mt-2 px-4 text-sm text-red-400">
              {errors.query.message}
            </p>
          )}

          {isSearchOpen && (
            <div
              role="region"
              aria-label="영화 검색 패널"
              className="absolute left-0 right-0 top-14 z-10 rounded-2xl border border-white/10 bg-[#242424] p-4 shadow-xl empty:hidden"
            >
              <MovieSearchSuggestions query={query} />
            </div>
          )}
        </form>
      </div>
    </header>
  );
}
