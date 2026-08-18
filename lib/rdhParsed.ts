// lib/rdhParsed.ts
//
// The structured half of an RDH receipt.
//
// WHY THIS EXISTS. Blaze POS prints the whole receipt as a Star Line Mode
// raster bitmap (lib/starRaster.ts), so the bytes on `GET /receipt/{sid}` —
// the only thing this page ever had — contain no text at all. The merchant
// name, the items and the total exist purely as pixels. The RDH indexer runs
// those pixels through the adapter's OCR and writes the result to DynamoDB;
// `GET /receipt/{sid}/parsed` (Papex_RDH/lambdas/fetch/handler.js) is how it
// comes back out.
//
// THE TIMING PROBLEM THIS WHOLE MODULE IS SHAPED BY. OCR takes ~46 seconds,
// measured against prod, twice. The customer taps the countertop device ~5 s
// after the POS arms it, ~10 s after the sale — so they open this page roughly
// 15 s in, while OCR still has ~30 s to run. The structured receipt therefore
// CANNOT be there on first paint, ever. Not "usually isn't": can't be. That is
// why the page renders the image first and polls (app/r/ReceiptUpgrade.tsx)
// rather than waiting, and why `parseStatus: "pending"` is a normal, expected
// answer rather than an error.

import { rdhApiBase } from "./rdh";
import type { ReceiptSummary } from "./receiptSummary";


/** Per-item shape returned by the parsed endpoint. */
export interface ParsedLineItem {
  name: string;
  quantity: number;
  price: number;
  sku: string | null;
}

/** The structured receipt, present only once there is something to show. */
export interface ParsedReceipt {
  merchantName: string | null;
  merchantAddress: string | null;
  date: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  lineItems: ParsedLineItem[];
  paymentMethod: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  receiptNumber: string | null;
  confidence: string | null;
  extractorEngine: string | null;
}

/**
 * - `pending`   the sid is real but the indexer hasn't written a row yet.
 * - `ok_raster` a bitmap receipt whose OCR hasn't landed (or failed). This is
 *               what the customer's first load almost always sees.
 * - `ok`        structured fields are available; `receipt` is populated.
 * - `failed`    indexed, but nothing could be parsed.
 */
export type ParseStatus = "pending" | "ok_raster" | "ok" | "failed";

export interface ParsedReceiptPayload {
  sid: string;
  parseStatus: ParseStatus;
  /** Whether a decoded bitmap exists for this receipt. Stays true after OCR. */
  hasImage: boolean;
  uploadedAt: string | null;
  receipt: ParsedReceipt | null;
}

export type ParsedFetchResult =
  | { status: "ok"; payload: ParsedReceiptPayload }
  | { status: "not_found" }
  | { status: "error" };

/**
 * Server-side fetch of the parsed receipt. Never throws — every failure
 * collapses to `{status:"error"}`, because this is strictly an ENRICHMENT of a
 * page that already works without it. If this call fails the customer still
 * gets the picture, which is exactly what they get today.
 */
export async function fetchParsedReceipt(sid: string): Promise<ParsedFetchResult> {
  const controller = new AbortController();
  // Shorter than lib/rdh.ts's 8 s byte fetch on purpose: this one runs
  // alongside that fetch, and it must never be the thing that makes a page
  // with a perfectly good image time out.
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${rdhApiBase()}/receipt/${sid}/parsed`, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (res.status === 404) return { status: "not_found" };
    if (!res.ok) return { status: "error" };

    const payload = normalizePayload(await res.json());
    return payload ? { status: "ok", payload } : { status: "error" };
  } catch {
    return { status: "error" };
  } finally {
    clearTimeout(timeout);
  }
}

const PARSE_STATUSES: ReadonlySet<string> = new Set(["pending", "ok_raster", "ok", "failed"]);

/**
 * Validate and narrow an untrusted JSON body into `ParsedReceiptPayload`.
 *
 * Exported because the client-side poller parses the very same shape and must
 * not get a second, laxer opinion about what a valid payload is. Returns null
 * rather than throwing or coercing: a body this doesn't recognise means "no
 * structured data", and "no structured data" is a state the page already
 * renders correctly.
 */
export function normalizePayload(raw: unknown): ParsedReceiptPayload | null {
  if (!isRecord(raw)) return null;
  const parseStatus = typeof raw.parseStatus === "string" && PARSE_STATUSES.has(raw.parseStatus)
    ? (raw.parseStatus as ParseStatus)
    : null;
  if (!parseStatus) return null;

  return {
    sid: typeof raw.sid === "string" ? raw.sid : "",
    parseStatus,
    hasImage: raw.hasImage === true,
    uploadedAt: typeof raw.uploadedAt === "string" ? raw.uploadedAt : null,
    receipt: normalizeReceipt(raw.receipt),
  };
}

function normalizeReceipt(raw: unknown): ParsedReceipt | null {
  if (!isRecord(raw)) return null;
  return {
    merchantName: str(raw.merchantName),
    merchantAddress: str(raw.merchantAddress),
    date: str(raw.date),
    subtotal: num(raw.subtotal),
    tax: num(raw.tax),
    total: num(raw.total),
    lineItems: Array.isArray(raw.lineItems)
      ? raw.lineItems.filter(isRecord).map((li) => ({
          name: str(li.name) ?? "",
          quantity: num(li.quantity) ?? 1,
          price: num(li.price) ?? 0,
          sku: str(li.sku),
        }))
      : [],
    paymentMethod: str(raw.paymentMethod),
    cardBrand: str(raw.cardBrand),
    cardLast4: str(raw.cardLast4),
    receiptNumber: str(raw.receiptNumber),
    confidence: str(raw.confidence),
    extractorEngine: str(raw.extractorEngine),
  };
}

/**
 * Is there enough here to be worth showing INSTEAD of the picture?
 *
 * Same bar as lib/receiptSummary.ts's hasStructure and the backend's own
 * check, and the bar matters: promoting an empty extraction would replace a
 * perfectly legible photograph of the receipt with three blank cards. When in
 * doubt, the picture wins.
 */
export function hasUsableReceipt(payload: ParsedReceiptPayload | null | undefined): boolean {
  const r = payload?.receipt;
  if (!r) return false;
  return r.merchantName != null || r.total != null || r.lineItems.length > 0;
}

/**
 * True when it is still worth polling: the receipt exists in some form but
 * the structured version hasn't arrived. `failed` is terminal — the indexer
 * looked and could not read it, and no amount of waiting changes that.
 */
export function shouldKeepPolling(payload: ParsedReceiptPayload | null | undefined): boolean {
  if (!payload) return true; // nothing known yet (server fetch errored) — try.
  if (hasUsableReceipt(payload)) return false;
  return payload.parseStatus === "pending" || payload.parseStatus === "ok_raster";
}

/**
 * Project a parsed receipt onto `ReceiptSummary`, the shape the designed cards
 * already render.
 *
 * Deliberately the SAME type the ESC/POS text path produces, so an OCR'd Blaze
 * receipt and a text receipt go through one renderer and one set of design
 * decisions. Anything that looks different between the two should be a bug in
 * here, not a second UI.
 */
export function parsedToSummary(receipt: ParsedReceipt): ReceiptSummary {
  return {
    merchantName: receipt.merchantName ?? undefined,
    // The backend already joins the printed address lines with ", " (the same
    // thing the text summarizer does), and MerchantHeaderCard re-joins with
    // ", " — so one element in, one line out, no double punctuation.
    addressLines: receipt.merchantAddress ? [receipt.merchantAddress] : [],
    dateline: receipt.date ?? undefined,
    items: receipt.lineItems.map((li) => ({
      label: li.name,
      name: li.name,
      qty: li.quantity,
      // `price` is the per-line amount on both paths (the RDH row's `price`
      // and `total` are the line total, not a unit price), so it maps straight
      // onto `amount` and TotalsCard's subtotal fallback stays correct.
      amount: li.price,
    })),
    subtotal: receipt.subtotal ?? undefined,
    tax: receipt.tax ?? undefined,
    tip: undefined,
    discount: undefined,
    total: receipt.total ?? undefined,
    paymentLine: paymentLineOf(receipt),
    // No verbatim text body: the "original" for a Blaze receipt is the bitmap,
    // not a line stream, and it gets its own collapsible (see app/r/ui.tsx).
    // Leaving this empty is what stops an empty monospace box rendering.
    bodyLines: [],
  };
}

function paymentLineOf(receipt: ParsedReceipt): string | undefined {
  // PaymentRow re-detects the brand and the last four from this one string
  // (lib/receiptSummary.ts), so hand it a line shaped like what a printer
  // would have produced rather than inventing a new structured prop.
  const parts = [receipt.paymentMethod ?? receipt.cardBrand, receipt.cardLast4 ? `****${receipt.cardLast4}` : null]
    .filter((p): p is string => typeof p === "string" && p.trim().length > 0);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

// ---- tiny guards -----------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function num(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
