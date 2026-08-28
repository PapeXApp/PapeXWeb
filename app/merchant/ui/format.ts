// app/merchant/ui/format.ts
//
// Small formatting helpers shared between the transactions list (filter
// pills, row timestamps) and Insights (chart labels, drill-through tooltips)
// — kept in ONE place so an hour/day-of-week label never drifts between the
// two pages that both need to describe the exact same MERCHANT_DISPLAY_TIMEZONE
// bucket a user might click through between.

import { MERCHANT_DISPLAY_TIMEZONE } from "@/lib/merchantTimezone";

/** 0 = Sunday .. 6 = Saturday — same order/labels as the Lambda's DOW_LABELS (handler.js) and MerchantInsights.byDayOfWeek[].label. */
export const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Short "8a"/"2p" style label for a 0-23 hour bucket — used by BarChart's x-axis and filter pills alike. */
export function hourLabel(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${hour < 12 ? "a" : "p"}`;
}

/** "8:00 AM" style label — used where a pill/tooltip needs to spell the hour out rather than abbreviate it. */
export function hourLabelLong(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const mm = "00";
  return `${h12}:${mm} ${hour < 12 ? "AM" : "PM"}`;
}

/**
 * Formats an ISO timestamp's date/time in MERCHANT_DISPLAY_TIMEZONE (NOT the
 * browser's local zone) — required so the transactions list's displayed
 * times agree with what a merchant just clicked in Insights (both bucket in
 * the same assumed zone; see MERCHANT_DISPLAY_TIMEZONE's comment in
 * lib/merchantApi.ts). Reuses one Intl.DateTimeFormat pair rather than
 * constructing one per row.
 */
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: MERCHANT_DISPLAY_TIMEZONE,
  month: "short",
  day: "numeric",
});
const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: MERCHANT_DISPLAY_TIMEZONE,
  hour: "numeric",
  minute: "2-digit",
});

export function formatMerchantDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return { date: DATE_FORMATTER.format(d), time: TIME_FORMATTER.format(d) };
}

/**
 * Human-friendly label for an IANA zone name, for the by-hour/by-day-of-week
 * chart captions — a chart of "hours" with no stated zone is exactly how
 * the UTC-vs-local mismatch this feature replaced went unnoticed. Falls
 * back to the raw IANA name for any zone this mapping doesn't know yet,
 * rather than guessing.
 */
const FRIENDLY_ZONE_LABELS: Record<string, string> = {
  "America/Los_Angeles": "Pacific time",
};

export function friendlyZoneLabel(timezone: string): string {
  return FRIENDLY_ZONE_LABELS[timezone] ?? timezone;
}

/**
 * Fixed `"en-US"` Intl formatters for money/counts — deliberately NOT
 * `toLocaleString()` with no locale argument, which resolves to the
 * runtime's default and can differ between the Next.js server process and a
 * visitor's browser. Same number, two different strings, and React throws a
 * hydration mismatch over what should've been a cosmetic detail. One
 * instance of each, reused across every call — same rationale as
 * DATE_FORMATTER/TIME_FORMATTER above.
 */
const MONEY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const COUNT_FORMATTER = new Intl.NumberFormat("en-US");

/**
 * "$130,130.81" — always 2 decimals, thousands separators, negatives as
 * "-$12.34". `null`/`undefined` render as "—", matching the dashboard's
 * existing missing-value convention (see formatMerchantDateTime's callers).
 * For dollar figures only — gross, totals, subtotals, tax, line-item
 * prices, per-shopper/per-card averages. Never for percentages or ratios.
 */
export function formatMoney(n: number | null | undefined): string {
  return n == null ? "—" : MONEY_FORMATTER.format(n);
}

/**
 * "1,428" — thousands separators, no decimals, "—" for null/undefined.
 * For whole-number counts that can plausibly run past 999 — transactions,
 * receipts, shoppers, merchants, devices. Never percentages, hours, or
 * dates, and never a value used for computation/sorting (format only at
 * the point of display).
 */
export function formatCount(n: number | null | undefined): string {
  return n == null ? "—" : COUNT_FORMATTER.format(Math.round(n));
}
