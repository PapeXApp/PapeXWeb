"use client";

// components/GoogleAnalytics.tsx
//
// Google Analytics for the whole site, started from the browser and gated.
// Replaces the two <Script> tags that app/layout.tsx used to render on every
// route, receipt links included. Why, what counts as a credential URL, and the
// sticky-off rule: lib/analyticsGate.ts. It renders nothing, so no server HTML
// of any route ever contains the GA tag.

import { useEffect } from "react";
import { startGoogleAnalytics, type GaDocument, type GaWindow } from "@/lib/analyticsGate";

export default function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  // After hydration, like the `afterInteractive` Script it replaces.
  useEffect(() => {
    // Started once the page has loaded and gone idle, so its ~180KB script
    // never competes with the first taps on a phone (Nico, 2026-10-22: the
    // menu was slow to respond while the page started up).
    const start = () =>
      startGoogleAnalytics(window as unknown as GaWindow, document as unknown as GaDocument, measurementId);
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const whenIdle = () => {
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(start, { timeout: 4000 });
      else timer = setTimeout(start, 1500);
    };
    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });
    return () => {
      window.removeEventListener("load", whenIdle);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [measurementId]);
  return null;
}
