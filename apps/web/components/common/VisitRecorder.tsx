"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function VisitRecorder() {
  const pathname = usePathname();
  const recorded = useRef(false);

  useEffect(() => {
    if (!pathname || pathname === "/admin" || pathname.startsWith("/admin/") || recorded.current) return;

    try {
      const storageKey = "cinemo.visit-id";
      const visitorId = localStorage.getItem(storageKey) ?? crypto.randomUUID();
      localStorage.setItem(storageKey, visitorId);
      recorded.current = true;

      void fetch("/api/v1/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "web", visitorId, visitId: crypto.randomUUID() }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // 방문 집계는 브라우저 저장소가 차단되어도 페이지 이용에 영향을 주지 않는다.
    }
  }, [pathname]);

  return null;
}
