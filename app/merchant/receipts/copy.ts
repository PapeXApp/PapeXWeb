// app/merchant/receipts/copy.ts
//
// The words for customer types and surfaces, in one place. The definitions are
// what lambdas/cards/lib/loyalty.js really does with the printed loyalty lines.

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
