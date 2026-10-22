// lib/server/loyaltyClick/handler.ts
//
// Counting clicks on the /w "join the rewards program" link
// (app/r/LoyaltyEnrollLink.tsx -> POST /api/events/loyalty-click).
//
// STORED (papexweb-aed97 Firestore, admin SDK only; no client rule matches
// these collections, so Firestore's default deny keeps them private):
//   loyalty_cta_clicks/{merchantId}_{sid}_{minute}
//       {merchantId, sid, page, ctaVersion, platform, day, ts}
//   loyalty_cta_clicks_daily/{merchantId}_{day}
//       {merchantId, day, count, updatedAt}
// `day` is the America/Los_Angeles date (the stores are in California).
// `platform` is ios / android / other, derived here from the user agent; the
// user agent itself, the IP and anything typed are never stored.
//
// DEDUPE: one click per (merchant, sid, minute). The event id encodes that
// key and is written with create(), so a double tap, a beacon retry or a
// second serverless instance cannot count twice; the daily counter moves in
// the same batch, only when the create succeeds. A per-IP limit (in memory,
// per instance, never stored) caps abuse.

import { isValidSid } from "@/lib/rdh";
import { MERCHANT_LOYALTY } from "@/lib/merchantLoyalty";
import { platformFromUserAgent, type Platform } from "@/lib/storeLinks";
import type { RateLimiter } from "@/lib/server/signup/rateLimit";

export const LOYALTY_CLICKS_COLLECTION = "loyalty_cta_clicks";
export const LOYALTY_CLICKS_DAILY_COLLECTION = "loyalty_cta_clicks_daily";
export const MAX_BODY_BYTES = 1024;
/** Per IP, per instance. Generous: a real customer clicks once or twice. */
export const LOYALTY_CLICK_RATE_LIMIT = { limit: 30, windowMs: 60 * 1000 } as const;

export interface LoyaltyClickEvent {
  merchantId: string;
  sid: string;
  page: "w";
  ctaVersion: string;
  platform: Platform;
  /** YYYY-MM-DD, America/Los_Angeles. */
  day: string;
  /** floor(epoch ms / 60 000): the dedupe bucket. */
  minute: number;
}

export interface LoyaltyClickStore {
  record(event: LoyaltyClickEvent): Promise<"recorded" | "duplicate">;
}

export interface LoyaltyClickDeps {
  getStore: () => LoyaltyClickStore | null;
  rateLimiter: RateLimiter;
  now: () => Date;
  log: { error: (m: string) => void };
}

export interface LoyaltyClickInput {
  bodyText: string | null;
  ip: string;
  userAgent: string;
}

export interface HandlerResult {
  status: number;
  body: { ok: boolean; error?: string; deduped?: boolean };
}

const DAY_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function pacificDay(d: Date): string {
  return DAY_FMT.format(d);
}

export function eventId(e: Pick<LoyaltyClickEvent, "merchantId" | "sid" | "minute">): string {
  return `${e.merchantId}_${e.sid}_${e.minute}`;
}

export async function handleLoyaltyClick(input: LoyaltyClickInput, deps: LoyaltyClickDeps): Promise<HandlerResult> {
  if (!deps.rateLimiter.check(input.ip).allowed) return { status: 429, body: { ok: false, error: "rate_limited" } };
  if (input.bodyText == null) return { status: 413, body: { ok: false, error: "too_large" } };

  let raw: unknown;
  try {
    raw = JSON.parse(input.bodyText);
  } catch {
    return { status: 400, body: { ok: false, error: "bad_json" } };
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { status: 400, body: { ok: false, error: "bad_body" } };
  const { merchantId, sid, page, ctaVersion } = raw as Record<string, unknown>;

  // Only a merchant whose CTA is live, with the version it is serving: an
  // arbitrary string can never create a row or a counter.
  const cfg = typeof merchantId === "string" ? MERCHANT_LOYALTY[merchantId] : undefined;
  if (!cfg || !cfg.enrollCtaEnabled || !cfg.enrollUrl) return { status: 400, body: { ok: false, error: "unknown_merchant" } };
  if (typeof sid !== "string" || !isValidSid(sid)) return { status: 400, body: { ok: false, error: "bad_sid" } };
  if (page !== "w") return { status: 400, body: { ok: false, error: "bad_page" } };
  if (ctaVersion !== cfg.ctaVersion) return { status: 400, body: { ok: false, error: "bad_cta_version" } };

  const store = deps.getStore();
  if (!store) return { status: 503, body: { ok: false, error: "not_configured" } };

  const now = deps.now();
  const event: LoyaltyClickEvent = {
    merchantId: merchantId as string,
    sid,
    page: "w",
    ctaVersion,
    platform: platformFromUserAgent(input.userAgent),
    day: pacificDay(now),
    minute: Math.floor(now.getTime() / 60_000),
  };
  try {
    const outcome = await store.record(event);
    return { status: 200, body: outcome === "duplicate" ? { ok: true, deduped: true } : { ok: true } };
  } catch (err) {
    deps.log.error(`[loyalty-click] store error: ${err instanceof Error ? err.message : "unknown"}`);
    return { status: 500, body: { ok: false, error: "store_error" } };
  }
}
