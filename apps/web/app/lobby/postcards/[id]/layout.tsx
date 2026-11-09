import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getPostcard } from "@/lib/api/postcards";

type PostcardLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PostcardLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const url = `https://www.cinemo.site/lobby/postcards/${encodeURIComponent(id)}`;
  const postcard = await getPostcard(id, AbortSignal.timeout(3000)).catch(() => null);
  const publicPostcard = postcard?.visibility === "PUBLIC" && postcard.status === "PUBLISHED" ? postcard : null;
  const movieTitle = publicPostcard?.movie?.title;
  const title = movieTitle ? `${movieTitle} · CINEMO 엽서` : "CINEMO 엽서";
  const description = publicPostcard?.content.replace(/\s+/g, " ").trim().slice(0, 140) ||
    "영화의 여운을 담은 CINEMO 엽서";
  const image = publicPostcard?.type === "SCENE"
    ? publicPostcard.media[0]?.url ?? publicPostcard.movie?.posterUrl
    : publicPostcard?.movie?.posterUrl ?? publicPostcard?.media[0]?.url;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      siteName: "CINEMO",
      url,
      images: image?.startsWith("https://") ? [{ url: image, alt: title }] : undefined,
    },
    twitter: { card: "summary", title, description, images: image?.startsWith("https://") ? [image] : undefined },
  };
}

export default function PostcardLayout({ children }: PostcardLayoutProps) {
  return children;
}
