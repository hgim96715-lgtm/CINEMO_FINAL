import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3051",
  ),
  title: {
    default: "CINEMO | 영화의 순간을 모으다",
    template: "%s | CINEMO",
  },
  description: "좋아하는 영화와 함께 새로운 추억을 쌓아가는 공간",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "CINEMO",
    title: "영화의 순간을 모으다 | CINEMO",
    description: "좋아하는 영화와 함께 새로운 추억을 쌓아가는 공간",
    url: "/",
    locale: "ko_KR",
  },

  twitter: {
    card: "summary_large_image",
    title: "영화의 순간을 모으다 | CINEMO",
    description: "좋아하는 영화와 함께 새로운 추억을 쌓아가는 공간",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
