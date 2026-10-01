import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CINEMO_BRAND } from "@cinemo/shared";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3051",
  ),

  title: {
    default: CINEMO_BRAND.title,
    template: "%s | CINEMO",
  },

  description: CINEMO_BRAND.description,

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    siteName: CINEMO_BRAND.name,
    title: CINEMO_BRAND.title,
    description: CINEMO_BRAND.description,
    url: "/",
    locale: "ko_KR",
  },

  twitter: {
    card: "summary_large_image",
    title: CINEMO_BRAND.title,
    description: CINEMO_BRAND.description,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
