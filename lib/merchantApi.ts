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

import type { ReceiptSummary, PaymentNetwork } from "./receiptSummary";
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

/** Full detail for the receipt-detail page (PRD §5.3) — wraps the same
 *  ReceiptSummary shape app/r's renderer already consumes, so tx/[sid]/page.tsx
 *  can reuse app/r/ui.tsx's cards unmodified. */
export interface MerchantTransactionDetail extends MerchantTransactionSummary {
  receipt: ReceiptSummary;
  hasStructure: boolean;
  /** Verbatim text fallback — always present; the only thing available when parseStatus === "failed". */
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
      ...init?.headers,
      Authorization: `Bearer ${idToken}`,
      Accept: "application/json",
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
