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
    startGoogleAnalytics(window as unknown as GaWindow, document as unknown as GaDocument, measurementId);
  }, [measurementId]);
  return null;
}
