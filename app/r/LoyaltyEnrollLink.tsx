"use client";

// app/r/LoyaltyEnrollLink.tsx
//
// The /w "join the rewards program" link. A plain <a href> so it always
// works; the click is counted on the side with sendBeacon (fetch keepalive as
// the fallback), and a failure to count never blocks the navigation. Opens in
// a new tab, like the page's other external links (AppCta's store links).

import type { ReactNode } from "react";

export const LOYALTY_CLICK_ENDPOINT = "/api/events/loyalty-click";

export interface LoyaltyClickBody {
  merchantId: string;
  sid: string;
  page: "w";
  ctaVersion: string;
}

type Nav = { sendBeacon?: (url: string, data: Blob) => boolean };
type Fetch = (url: string, init: RequestInit) => Promise<unknown>;

/** Fire-and-forget. Returns which transport took it (for tests). Never throws. */
export function reportLoyaltyClick(
  body: LoyaltyClickBody,
  nav: Nav | undefined = typeof navigator === "undefined" ? undefined : navigator,
  doFetch: Fetch | undefined = typeof fetch === "undefined" ? undefined : fetch,
): "beacon" | "fetch" | "none" {
  const json = JSON.stringify(body);
  try {
    if (nav?.sendBeacon?.(LOYALTY_CLICK_ENDPOINT, new Blob([json], { type: "application/json" }))) return "beacon";
  } catch {
    // fall through to fetch
  }
  try {
    if (doFetch) {
      void doFetch(LOYALTY_CLICK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
        keepalive: true,
      }).catch(() => {});
      return "fetch";
    }
  } catch {
    // counting is best-effort
  }
  return "none";
}

export function LoyaltyEnrollLink({
  href,
  click,
  className,
  style,
  children,
}: {
  href: string;
  click: LoyaltyClickBody;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={() => {
        reportLoyaltyClick(click);
      }}
    >
      {children}
    </a>
  );
}
