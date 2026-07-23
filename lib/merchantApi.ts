// lib/merchantApi.ts
//
// Typed client for the merchant read API (Papex_RDH's `merchant-api` Lambda,
// plan.md M2 — `/merchant/*` routes on the existing HTTP API, JWT-gated).
// M5 (this milestone) is UI-shell-over-mock-data: every export below has a
// real `fetch()` implementation AND, behind NEXT_PUBLIC_MERCHANT_MOCK=1,
// delegates to lib/merchantMock.ts instead so the whole dashboard demos with
// zero backend. The two paths share return types, so flipping the env var
// is the only thing that changes once M2 ships for real.
//
// Auth: every call attaches the caller's Firebase ID token as a Bearer
// header. `merchant_id` is never sent by the client — the API resolves it
// server-side from the token's uid via the merchant registry (plan.md's
// gsi_uid lookup), so there's no client-controlled tenant parameter to spoof.
//
// This is a client-side fetch client (unlike lib/rdh.ts's server-only
// fetchReceiptBytes for the CORS-less consumer `/receipt/{sid}` endpoint):
// the merchant API is a distinct, authenticated surface that will have CORS
// configured for merchant.papex.app, and the dashboard pages need
// client-side interactivity (filters, search, "load more", window toggles)
// that's simplest wired straight to client fetches with the ID token already
// in hand from the auth context.

import type { PaymentNetwork } from "./receiptSummary";
import * as mock from "./merchantMock";

export type { PaymentNetwork };

export const RDH_API_BASE =
  process.env.NEXT_PUBLIC_RDH_API_BASE?.replace(/\/$/, "") || "https://api.papex.app";

export const MERCHANT_MOCK = process.env.NEXT_PUBLIC_MERCHANT_MOCK === "1";

// ---------------------------------------------------------------------------
// Shared domain types
// ---------------------------------------------------------------------------

export type ParseConfidence = "high" | "low";
export type ParseStatus = "ok" | "failed";

/** Row shape for the transactions list (PRD §5.2). */
export interface MerchantTransactionSummary {
  sid: string;
  deviceId: string;
  /** Backend upload clock, ISO 8601 — the durable sort key (device timestamp is untrusted, plan.md). */
  uploadedAt: string;
  total: number | null;
  paymentMethod: PaymentNetwork | null;
  cardLast4: string | null;
  receiptNumber: string | null;
  merchantName: string | null;
  /** Short text used for the free-text item search (PRD §5.2 "search by ... item text"). */
  itemsPreview: string;
  confidence: ParseConfidence;
  parseStatus: ParseStatus;
}

/** A single line item as carried on the transaction-detail metadata (PRD
 *  §5.3). This is informational only — the receipt-detail page does NOT
 *  render from this; it re-derives the same information (plus merchant
 *  name/address/dateline, which aren't part of this metadata at all) by
 *  parsing the raw bytes from `getReceiptBytes` through the web's own
 *  parseEscPos + summarizeReceipt, exactly like app/r does. See
 *  app/merchant/tx/[sid]/page.tsx. */
export interface MerchantLineItem {
  name: string;
  quantity: number;
  price: number;
}

/** Full detail for the receipt-detail page (PRD §5.3). Bare top-level object,
 *  camelCase throughout, NO `receipt`/ReceiptSummary field — B5's fix moved
 *  rendering to a client-side "fetch bytes, parse with the same pipeline
 *  app/r uses" flow instead of the API trying to fabricate a ReceiptSummary
 *  server-side. This is metadata + the verbatim fallback text only. */
export interface MerchantTransactionDetail {
  sid: string;
  uploadedAt: string;
  deviceId: string | null;
  parseStatus: ParseStatus;
  confidence: ParseConfidence;
  total: number | null;
  subtotal: number | null;
  tax: number | null;
  receiptNumber: string | null;
  paymentMethod: PaymentNetwork | null;
  cardBrand: string | null;
  cardLast4: string | null;
  lineItems: MerchantLineItem[];
  /** Verbatim text fallback — always present; the only thing rendered when
   *  parseStatus === "failed", or when the bytes fetch/parse fails. */
  rawText: string;
}

export interface TransactionsPage {
  transactions: MerchantTransactionSummary[];
  nextCursor: string | null;
}

export interface ListTransactionsParams {
  cursor?: string;
  from?: string; // ISO date
  to?: string; // ISO date
  limit?: number;
}

export type InsightsWindow = "today" | "7d" | "30d";

export interface HourBucket {
  hour: number; // 0-23, local to the merchant's device timezone (backend-resolved)
  count: number;
  gross: number;
}

export interface DayOfWeekBucket {
  day: number; // 0 = Sunday .. 6 = Saturday
  label: string;
  count: number;
  gross: number;
}

export interface TopItem {
  name: string;
  count: number;
}

export interface MerchantInsights {
  window: InsightsWindow;
  count: number;
  gross: number;
  avgTicket: number;
  byHour: HourBucket[];
  byDayOfWeek: DayOfWeekBucket[];
  topItems: TopItem[];
}

export interface TapRate {
  window: InsightsWindow;
  /** null = unavailable (adapter SPOF or no claim data yet) — render an "unavailable" state, never 0%. */
  rate: number | null;
  claimed: number;
  total: number;
}

export type DeviceStatus = "ok" | "stale" | "never";

export interface MerchantDevice {
  deviceId: string;
  label: string;
  lastUploadAt: string | null;
  status: DeviceStatus;
}

// ---------------------------------------------------------------------------
// Auth + fetch plumbing
// ---------------------------------------------------------------------------

class MerchantApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "MerchantApiError";
  }
}

async function authedFetch(path: string, idToken: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${RDH_API_BASE}${path}`, {
    ...init,
    headers: {
      // Default to JSON, but let a caller-supplied Accept (e.g.
      // getReceiptBytes's application/octet-stream) win — it must come
      // after the default and before the spread to do that.
      Accept: "application/json",
      ...init?.headers,
      Authorization: `Bearer ${idToken}`,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new MerchantApiError(`Merchant API ${path} failed: ${res.status}`, res.status);
  }
  return res;
}

// `params` is typed as `object` (not `Record<string, ...>`) on purpose: TS's
// index-signature check rejects passing a plain named interface (like
// ListTransactionsParams) where an index-signature type is expected, even
// though every property is a compatible string/number/undefined at runtime.
function qs(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, string | number | undefined | null>)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/** GET /merchant/transactions */
export async function listTransactions(
  idToken: string,
  params: ListTransactionsParams = {}
): Promise<TransactionsPage> {
  if (MERCHANT_MOCK) return mock.mockListTransactions(params);
  const res = await authedFetch(`/merchant/transactions${qs(params)}`, idToken);
  return res.json();
}

/** GET /merchant/transactions/{sid} */
export async function getTransaction(idToken: string, sid: string): Promise<MerchantTransactionDetail | null> {
  if (MERCHANT_MOCK) return mock.mockGetTransaction(sid);
  const res = await authedFetch(`/merchant/transactions/${encodeURIComponent(sid)}`, idToken);
  if (res.status === 404) return null;
  return res.json();
}

/**
 * GET /merchant/receipt/{sid} — raw ESC/POS bytes for the receipt-detail
 * page to parse client-side with the same parseEscPos + summarizeReceipt
 * pipeline app/r uses (B5's fix: the API stops trying to fabricate the
 * web's ReceiptSummary shape server-side).
 *
 * ASSUMPTION (unlike lib/rdh.ts's server-side fetchReceiptBytes for the
 * CORS-less consumer `/receipt/{sid}` endpoint): this is a browser-side
 * fetch against the merchant API, which — per this file's header comment —
 * has CORS configured for merchant.papex.app. The Lambda
 * (Papex_RDH/lambdas/merchant-api/handler.js getReceiptBytes) returns
 * `{ statusCode: 200, isBase64Encoded: true, headers: {"Content-Type":
 * "application/octet-stream"}, body: <base64> }`. API Gateway HTTP API
 * (payload format 2.0) base64-decodes a response with `isBase64Encoded:
 * true` before it reaches the client — the browser sees a genuine binary
 * `application/octet-stream` body, not a base64 string — so `res.arrayBuffer()`
 * is correct here; this is NOT re-decoding base64 in the client.
 *
 * Throws (via authedFetch) on any non-2xx response — 404 (sid not found /
 * not owned by this merchant) included — so the caller (tx/[sid]/page.tsx)
 * can catch and fall back to rendering `rawText` from the metadata call,
 * same as a parse failure.
 */
export async function getReceiptBytes(idToken: string, sid: string): Promise<Uint8Array> {
  if (MERCHANT_MOCK) return mock.mockGetReceiptBytes(sid);
  const res = await authedFetch(`/merchant/receipt/${encodeURIComponent(sid)}`, idToken, {
    headers: { Accept: "application/octet-stream" },
  });
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

/** GET /merchant/insights?window= */
export async function getInsights(idToken: string, window: InsightsWindow): Promise<MerchantInsights> {
  if (MERCHANT_MOCK) return mock.mockGetInsights(window);
  const res = await authedFetch(`/merchant/insights${qs({ window })}`, idToken);
  return res.json();
}

/** GET /merchant/tap-rate?window= — failure/unavailability always collapses to `rate: null`, never throws. */
export async function getTapRate(idToken: string, window: InsightsWindow): Promise<TapRate> {
  if (MERCHANT_MOCK) return mock.mockGetTapRate(window);
  try {
    const res = await authedFetch(`/merchant/tap-rate${qs({ window })}`, idToken);
    return await res.json();
  } catch {
    return { window, rate: null, claimed: 0, total: 0 };
  }
}

/** GET /merchant/devices */
export async function listDevices(idToken: string): Promise<MerchantDevice[]> {
  if (MERCHANT_MOCK) return mock.mockListDevices();
  const res = await authedFetch("/merchant/devices", idToken);
  return res.json();
}

/** GET /merchant/export.csv — triggers a browser download of the date-ranged transactions CSV. */
export async function exportCsv(idToken: string, params: { from?: string; to?: string } = {}): Promise<void> {
  const filename = `papex-transactions${params.from ? `-${params.from}` : ""}${params.to ? `_${params.to}` : ""}.csv`;
  const csvText = MERCHANT_MOCK
    ? mock.mockExportCsv(params)
    : await (await authedFetch(`/merchant/export.csv${qs(params)}`, idToken)).text();

  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
