"use client";

import { useEffect } from "react";

import { recordServiceEvent } from "@/lib/analytics/service-events";

export function ClickEventRecorder() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const element = event.target;
      if (!(element instanceof Element)) return;

      const anchor = element.closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";

      if (/^\/movies\/[0-9a-f-]{36}(?:[?#]|$)/i.test(href)) {
        recordServiceEvent("movie_detail_open");
      } else if (/^\/login(?:[?#]|$)/.test(href)) {
        recordServiceEvent("login_intent");
      } else if (/\/cinemas?(?:[/?#]|$)/.test(href)) {
        recordServiceEvent("cinema_search_intent");
      } else if (/^https?:\/\/apps\.apple\.com\//i.test(href)) {
        recordServiceEvent("app_store_open");
      }
    };

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return null;
}
