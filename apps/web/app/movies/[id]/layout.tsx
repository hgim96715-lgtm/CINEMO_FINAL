import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getMovie } from "../../../lib/api/movies";

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
  const movie = await getMovie(id);
  const primarytitle =
    movie?.titles.find((item) => item.titleType === "PRIMARY") ??
    movie?.titles[0];

  const title = primarytitle?.title ?? "영화 상세";
  const poster = movie?.media.find(
    (item) => item.mediaType === "POSTER" && item.isPrimary,
  );

  const description = movie
    ? `${title}의 영화 정보와 출연진, 장르, 개봉 정보를 확인하세요.`
    : "CINEMO 영화 상세 정보";

  return {
    title,
    description,
    alternates: {
      canonical: `/movies/${id}`,
    },
    openGraph: {
      type: "article",
      title: `${title} | CINEMO`,
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
  };
}
export default function MovieLayout({ children }: MovieLayoutProps) {
  return children;
}
