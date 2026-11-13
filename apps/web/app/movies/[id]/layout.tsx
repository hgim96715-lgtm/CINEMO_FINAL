import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CINEMO_BRAND } from "@cinemo/shared";

import { getCachedMovie } from "@/lib/api/server-movies";
import { getPreferredMovieTitle } from "@/lib/movies/title";

type MovieLayoutProps = {
  children: ReactNode;
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: MovieLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const movie = await getCachedMovie(id);

  const primaryTitle = movie
    ? getPreferredMovieTitle(movie.titles)
    : undefined;

  const title = primaryTitle?.title ?? "영화 상세";
  const poster =
    movie?.media.find(
      (item) => item.mediaType === "POSTER" && item.isPrimary,
    ) ?? movie?.media.find((item) => item.mediaType === "POSTER");
  const overview = movie?.overview?.replace(/\s+/g, " ").trim();

  const description = overview
    ? `${overview.slice(0, 157)}${overview.length > 157 ? "…" : ""}`
    : movie
      ? `${title}의 영화 정보와 출연진, 장르, 개봉 정보를 확인하세요.`
    : `${CINEMO_BRAND.slogan}. ${CINEMO_BRAND.description}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/movies/${id}`,
    },
    openGraph: {
      type: "article",
      title: `${title} | ${CINEMO_BRAND.name}`,
      description,
      url: `/movies/${id}`,
      images: poster
        ? [
            {
              url: poster.url,
              alt: `${title} 포스터`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${CINEMO_BRAND.name}`,
      description,
      images: poster ? [poster.url] : undefined,
    },
  };
}

export default function MovieLayout({ children }: MovieLayoutProps) {
  return children;
}
