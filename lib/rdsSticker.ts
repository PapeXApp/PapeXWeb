// lib/rdsSticker.ts
//
// RDS sticker resolution: what `https://papex.app/r/<merchantSlug>/<registerSlug>`
// (the NDEF URL of the passive NFC sticker on a register) should show.
//
// The sticker carries no sid — it is the same URL for every customer at that
// register. The adapter backend knows which sale just happened there:
//   GET {ADAPTER}/api/v1/pos/rds/<merchantSlug>/<registerSlug>
//     200 { sid, total, currency, time, isRefund, candidates: [...] }
//         candidates = every unclaimed sale at that register in the last
//         ~120 s, newest first (several when two sales were close together)
//     404 { error: "unknown_register" } | { error: "no_recent_sale" }
// Contract: papex-adapter-backend docs/POS_RECEIPT_DELIVERY.md, src/api/pos.js.
//
// Server-side only (app/r/[merchant]/[register]/page.tsx), like every other
// backend call under /r: the adapter host stays out of client code, and the
// answer changes from one second to the next, so it is never cached. The sids
// it returns are capabilities and are never logged.

import { adapterBase } from "./adapter";
import { isValidSid } from "./rdh";

/** Same rule as the adapter's SLUG_RE. */
const SLUG_RE = /^[a-z0-9-]{1,64}$/;

/** `demo` is reserved by the adapter and by the /r/demo route. */
const RESERVED_MERCHANT_SLUGS: ReadonlySet<string> = new Set(["demo"]);

export function isValidStickerSlugs(merchant: string, register: string): boolean {
  return SLUG_RE.test(merchant) && SLUG_RE.test(register) && !RESERVED_MERCHANT_SLUGS.has(merchant);
}

export interface StickerCandidate {
  sid: string;
  total: number | null;
  currency: string | null;
  /** ISO timestamp of the sale, or null. */
  time: string | null;
  isRefund: boolean;
}

export type StickerResolution =
  | { kind: "receipt"; sid: string }
  | { kind: "pick"; candidates: StickerCandidate[] }
  | { kind: "no_recent_sale" }
  | { kind: "unknown_register" }
  | { kind: "error" };

/** Where a resolved sid goes: the existing receipt page. */
export function receiptPathFor(sid: string): string {
  return `/r?sid=${sid}`;
}

/**
 * Ask the adapter which sale a sticker tap belongs to. Never throws: timeouts,
 * network failures and unexpected answers are `{kind: "error"}`, which the
 * page renders as a retry screen.
 */
export async function resolveSticker(merchant: string, register: string): Promise<StickerResolution> {
  if (!isValidStickerSlugs(merchant, register)) return { kind: "unknown_register" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${adapterBase()}/api/v1/pos/rds/${merchant}/${register}`, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    const body: unknown = await res.json().catch(() => null);

    if (res.status === 404) {
      const error = isRecord(body) ? body.error : undefined;
      if (error === "no_recent_sale") return { kind: "no_recent_sale" };
      if (error === "unknown_register") return { kind: "unknown_register" };
      return { kind: "error" };
    }
    if (!res.ok || !isRecord(body)) return { kind: "error" };

    return classify(body);
  } catch {
    return { kind: "error" };
  } finally {
    clearTimeout(timeout);
  }
}

/** Exported for tests: a 200 body -> what to show. */
export function classify(body: Record<string, unknown>): StickerResolution {
  const fromList = Array.isArray(body.candidates) ? body.candidates.map(toCandidate) : [];
  // Malformed entries are dropped, never shown: each one links to a receipt.
  const candidates = fromList.filter((c): c is StickerCandidate => c != null);
  if (candidates.length === 0) {
    // An adapter that sent no list still names the newest sale at the top level.
    const top = toCandidate(body);
    return top ? { kind: "receipt", sid: top.sid } : { kind: "error" };
  }
  if (candidates.length === 1) return { kind: "receipt", sid: candidates[0].sid };
  return { kind: "pick", candidates };
}

function toCandidate(raw: unknown): StickerCandidate | null {
  if (!isRecord(raw) || typeof raw.sid !== "string" || !isValidSid(raw.sid)) return null;
  return {
    sid: raw.sid,
    total: typeof raw.total === "number" && Number.isFinite(raw.total) ? raw.total : null,
    currency: typeof raw.currency === "string" && raw.currency.trim() !== "" ? raw.currency.trim() : null,
    time: typeof raw.time === "string" && !Number.isNaN(Date.parse(raw.time)) ? raw.time : null,
    isRefund: raw.isRefund === true,
  };
}

/** "$12.40", or "12.40 XYZ" for a currency Intl does not know. */
export function formatCandidateTotal(c: StickerCandidate): string {
  if (c.total == null) return "Amount unavailable";
  const currency = c.currency ?? "USD";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(c.total);
  } catch {
    return `${c.total.toFixed(2)} ${currency}`;
  }
}

/**
 * "Just now" / "1 min ago" / "3 min ago". Relative on purpose: the page is
 * rendered on the server, which does not know the shop's time zone, and the
 * customer only needs to tell two sales from the last two minutes apart.
 */
export function formatCandidateAge(c: StickerCandidate, now: Date): string | null {
  if (c.time == null) return null;
  const minutes = Math.floor((now.getTime() - Date.parse(c.time)) / 60_000);
  if (minutes < 1) return "Just now";
  return minutes === 1 ? "1 min ago" : `${minutes} min ago`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
