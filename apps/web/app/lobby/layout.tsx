import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Lobby",
  description:
    "현재 상영작과 인기 영화, 새로운 영화의 순간을 만나는 CINEMO Lobby.",
  alternates: {
    canonical: "/lobby",
  },
  openGraph: {
    title: "Lobby | CINEMO",
    description:
      "현재 상영작과 인기 영화, 새로운 영화의 순간을 만나는 CINEMO Lobby.",
    url: "/lobby",
    type: "website",
  },
};

export default function LobbyLayout({ children }: { children: ReactNode }) {
  return children;
}
