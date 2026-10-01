import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CINEMO_BRAND } from "@cinemo/shared";

export const metadata: Metadata = {
  title: "Lobby",
  description: `${CINEMO_BRAND.slogan}. ${CINEMO_BRAND.description}`,
  alternates: {
    canonical: "/lobby",
  },
  openGraph: {
    title: `Lobby | ${CINEMO_BRAND.name}`,
    description: `${CINEMO_BRAND.slogan}. ${CINEMO_BRAND.description}`,
    url: "/lobby",
    type: "website",
  },
};

export default function LobbyLayout({ children }: { children: ReactNode }) {
  return children;
}
