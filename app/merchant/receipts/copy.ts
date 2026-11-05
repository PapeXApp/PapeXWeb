// app/merchant/receipts/copy.ts
//
// The words for customer types, surfaces and what a publish reaches, in one
// place. The customer-type definitions are what lambdas/cards/lib/loyalty.js
// really does with the printed loyalty lines.

import type { LiveSurface, LoyaltySegment } from "@/lib/merchantReceipts/types";

export const SEGMENT_COPY: Record<LoyaltySegment, { label: string; short: string; who: string; detail: string }> = {
  first: {
    label: "First-time customer",
    short: "First-time",
    who: "A first-time customer",
    detail: "The printed points balance equals this purchase, so they had none before.",
  },
  returning: {
    label: "Returning customer",
    short: "Returning",
    who: "A returning customer",
    detail: "The printed points balance is higher or lower than this purchase.",
  },
  none: {
    label: "Not a member",
    short: "Not a member",
    who: "A customer who isn't a member",
    detail: "The receipt prints Member Points: N/A.",
  },
  no_points: {
    label: "Member, no points shown",
    short: "No points shown",
    who: "A member with no points shown",
    detail: "The receipt prints a member line with no points line under it.",
  },
  unknown: {
    label: "Can't tell",
    short: "Can't tell",
    who: "A customer PapeX can't place",
    detail: "The receipt has no loyalty lines PapeX can read.",
  },
};

export const SURFACE_COPY: Record<LiveSurface, { label: string }> = {
  clip: { label: "App Clip" },
  web: { label: "Web tap page" },
  app: { label: "PapeX app" },
};

/**
 * What a publish reaches, in the page's words. A live demo's link always shows
 * the newest version (merchant-api LIVE_DEMO_MERCHANTS, `liveDemo` on the
 * config). Everyone else's publish decorates only receipts printed after it.
 */
export function publishCopy(liveDemo: { link: string } | null | undefined) {
  if (liveDemo) {
    return {
      sheet: "Your demo link shows this within about a minute.",
      published: (version: number) => `Version ${version} published. Your demo link shows it within about a minute.`,
      versions: "Each publish is a new version, and your demo link always shows the newest one.",
    };
  }
  return {
    sheet: "Customers see this on receipts printed from now on, within about a minute. Receipts already printed keep the offers they came with.",
    published: (version: number) => `Version ${version} published. It reaches receipts printed from now on, within about a minute.`,
    versions: "Each publish is a new version and applies to receipts printed after it. Receipts already printed keep the offers they came with.",
  };
}
