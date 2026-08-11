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

/**
 * Client fetches go through our own origin, not straight at RDH_API_BASE —
 * app/api/rdh/merchant/[...path] forwards them server-side. Requests are
 * therefore same-origin and never hit a CORS preflight, which is what
 * plan.md specified ("server-side fetch (no CORS issue)").
 *
 * Fetching api.papex.app directly worked only on merchant.papex.app, the one
 * origin in the API Gateway allow_origins list; anywhere else — local dev on
 * merchant.localhost, a preview deployment — every call failed its preflight.
 *
 * RDH_API_BASE is still the upstream the proxy targets (it reads the same
 * env var server-side), so pointing a local build at a different backend
 * keeps working.
 */
export const MERCHANT_API_BASE = "/api/rdh";

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

/**
 * "Receipt forensics" findings — Papex_RDH's `GET /merchant/forensics`
 * (docs/COMPETITOR_INSIGHTS_USE_CASES.md Family H / §4 "Section 1 — Needs
 * your attention"). Own-transactions-only analyses (no panel, no
 * cross-merchant data, no shopper identity); the Lambda's `lib/forensics.js`
 * is the source of truth for these shapes and the thresholds behind them.
 *
 * Every finding is discriminated by `type` and carries a merchant-facing
 * `headline`/`detail` plus enough structured evidence (sids / timestamps /
 * deviceIds) for the merchant to verify it themselves in
 * /merchant/transactions — never a bare accusation.
 */
export type ForensicsSeverity = "high" | "medium" | "low";

export interface TaxRateInconsistencyFinding {
  type: "tax_rate_inconsistency";
  severity: ForensicsSeverity;
  headline: string;
  detail: string;
  minorityRatePercent: number;
  majorityRatePercent: number;
  receiptCount: number;
  totalQualifyingTransactions: number;
  percentOfReceipts: number;
  firstSeenAt: string | null;
  deviceIds: string[];
  estimatedImpactAmount: number;
  /** "under" = the minority-rate receipts collected less tax than the majority rate would have; "over" = more; "none" = no dollar delta (should not occur in practice). */
  estimatedImpactDirection: "under" | "over" | "none";
  sids: string[];
}

export interface DuplicateTransactionFinding {
  type: "duplicate_transaction";
  severity: ForensicsSeverity;
  headline: string;
  detail: string;
  deviceId: string;
  cardLast4: string;
  amount: number;
  gapSeconds: number;
  transactions: { sid: string | null; uploadedAt: string }[];
}

export interface PosHygieneFinding {
  type: "pos_hygiene";
  severity: ForensicsSeverity;
  headline: string;
  detail: string;
  openRingLineItemCount: number;
  totalLineItemCount: number;
  percentOpenRing: number;
  receiptsWithOpenRing: number;
  receiptsWithoutOpenRing: number;
  /** avgTicket(receipts with an open-ring item) - avgTicket(receipts without). null when either group is below the minimum sample size to compare. */
  avgTicketDifference: number | null;
  sids: string[];
}

export interface DeviceSilenceFinding {
  type: "device_silence";
  severity: ForensicsSeverity;
  headline: string;
  detail: string;
  deviceId: string;
  gapStart: string;
  /** null when the device is still silent as of the end of the query window (an ongoing gap, not a resolved one). */
  gapEnd: string | null;
  gapHours: number;
  estimatedTransactionsMissed: number;
  lastSidBeforeGap: string | null;
  firstSidAfterGap: string | null;
}

export type ForensicsFinding =
  | TaxRateInconsistencyFinding
  | DuplicateTransactionFinding
  | PosHygieneFinding
  | DeviceSilenceFinding;

export interface MerchantForensics {
  window: InsightsWindow;
  findings: ForensicsFinding[];
}

// ---------------------------------------------------------------------------
// Market intelligence panel (Papex_RDH's `GET /merchant/market/*`,
// docs/goals/competitor-insights/plan.md §3). Category-level ONLY — no
// competitor is ever named or identifiable in any of these shapes (plan.md's
// fixed constraint #1). Reads precomputed `MKT#*` items
// (Papex_RDH/scripts/seed-market-panel.mjs writes them;
// Papex_RDH/lambdas/merchant-api/lib/marketPanel.js is the shaping/
// suppression source of truth these types mirror).
//
// `basis` is required on BOTH arms of PanelMetric<T> — plan.md §3: "a metric
// without a basis is not a constructible value." The Lambda builds every
// metric through one helper (buildPanelMetric in lib/marketPanel.js) so this
// is structurally, not just conventionally, true server-side; the type here
// carries that same guarantee into the client.
// ---------------------------------------------------------------------------

export interface PanelBasis {
  merchants: number;
  /** null EXACTLY when the metric is suppressed — a sub-floor shopper count is never published (plan.md §4). */
  shoppers: number | null;
  windowStart: string;
  windowEnd: string;
  /** Server-rendered sentence — render VERBATIM, don't reconstruct from the numbers (plan.md §6's BasisLine). */
  label: string;
}

export type SuppressionReason = "below_shopper_floor" | "below_merchant_floor" | "no_data";

export type PanelMetric<T> =
  | { status: "ok"; value: T; basis: PanelBasis }
  | { status: "suppressed"; value: null; basis: PanelBasis; reason: SuppressionReason; message: string };

/**
 * The traffic index's OWN-side basis (the merchant's live transaction
 * volume) is a DELIBERATELY different shape from PanelBasis (`transactions`,
 * not `merchants`/`shoppers`) so own-data and panel-data bases can never be
 * swapped or confused at a callsite (plan.md §3).
 */
export interface OwnBasis {
  transactions: number;
  windowStart: string;
  windowEnd: string;
  label: string;
}

export interface PanelCategory {
  id: string;
  label: string;
}

export type CrossShoppingWindow = "30d" | "90d";
export type TrafficIndexWindow = "7d" | "30d";

/** Ratios/percentages only — no projected absolute dollar figures (plan.md's fixed constraint #4). */
export interface ShareOfWallet {
  currentPct: number;
  priorPct: number;
  deltaPct: number;
}

/** Per-shopper averages, both sides of the same denominator (plan.md's fixed constraint #4 allows per-shopper averages). */
export interface CompetitiveSetBreadth {
  yourShoppersVenuesPerMonth: number;
  categoryAvgVenuesPerMonth: number;
}

/** One adjacent-category demand row. Carries its OWN basis — rows aggregate over different cohorts, so a section-level basis wouldn't be honest for any one row (plan.md §3). */
export interface UnservedDemandRow {
  categoryId: string;
  categoryLabel: string;
  carriedByYou: boolean;
  spendPerShopperMonth: number;
  shopperPenetrationPct: number;
  basis: PanelBasis;
}

/**
 * `rows` has ALREADY had every sub-floor category removed server-side
 * (plan.md §4: "removed from the array entirely, never returned with a null
 * value") — `hiddenRowCount` is the only trace a suppressed row leaves. A
 * client that ignores `status` on the wrapping PanelMetric still cannot
 * render a sub-floor figure.
 */
export interface UnservedDemand {
  rows: UnservedDemandRow[];
  hiddenRowCount: number;
}

export interface CrossShoppingResponse {
  window: CrossShoppingWindow;
  /** null when the merchant has no MKT# panel data at all yet (plan.md §1's "no_data" state — 200, never 404). */
  generatedAt: string | null;
  dataSource: string | null;
  category: PanelCategory | null;
  shareOfWallet: PanelMetric<ShareOfWallet>;
  competitiveSet: PanelMetric<CompetitiveSetBreadth>;
  unservedDemand: PanelMetric<UnservedDemand>;
  /** Footer disclosure string — render verbatim (plan.md §6, page section 5). */
  disclosure: string;
}

export interface TrafficIndexPoint {
  date: string;
  index: number;
}

export interface TrafficIndex {
  categoryChangePct: number;
  /** Computed live server-side from the merchant's own transactions — never precomputed/stored (plan.md §1). */
  yourChangePct: number;
  series: TrafficIndexPoint[];
}

export interface TrafficIndexResponse {
  window: TrafficIndexWindow;
  generatedAt: string | null;
  dataSource: string | null;
  category: PanelCategory | null;
  index: PanelMetric<TrafficIndex>;
  /**
   * null whenever `index` is suppressed for ANY reason — including plan.md
   * §4's 4th, own-side-only condition (< MIN_OWN_TXNS in the current OR
   * prior period), which suppresses the whole index even when the
   * category side is healthy.
   */
  yourBasis: OwnBasis | null;
  disclosure: string;
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
  const res = await fetch(`${MERCHANT_API_BASE}${path}`, {
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

/**
 * GET /merchant/forensics?window= — receipt-forensics findings, default
 * window 30d (a tax-rate split or a device's cadence baseline needs more
 * than a day or a week of receipts to be trustworthy — see
 * Papex_RDH/lambdas/merchant-api/lib/forensics.js's THRESHOLDS).
 *
 * Deliberately has NO `MERCHANT_MOCK` branch, unlike every other function in
 * this file: these findings are only meaningful when they're derived from
 * real receipts (a real tax-rate split, a real duplicate charge, a real
 * device gap) — a synthetic demo finding would be an unverifiable
 * accusation with nothing behind it, which is exactly what this feature was
 * built to never produce. Always hits the live API.
 */
export async function getForensics(idToken: string, window: InsightsWindow = "30d"): Promise<MerchantForensics> {
  const res = await authedFetch(`/merchant/forensics${qs({ window })}`, idToken);
  return res.json();
}

/**
 * GET /merchant/market/cross-shopping?window= — share-of-wallet /
 * competitive-set / unserved-demand panel (plan.md §3). Unlike
 * getForensics(), this DOES have a MERCHANT_MOCK branch: the panel is
 * explicitly synthetic demo data even against the live API
 * (`dataSource: "demo_panel"`, plan.md risk #1), so a mock is a legitimate
 * preview of the real response shape rather than an unverifiable accusation.
 * Default window 30d, matching the Lambda's default.
 */
export async function getCrossShopping(idToken: string, window: CrossShoppingWindow = "30d"): Promise<CrossShoppingResponse> {
  if (MERCHANT_MOCK) return mock.mockGetCrossShopping(window);
  const res = await authedFetch(`/merchant/market/cross-shopping${qs({ window })}`, idToken);
  return res.json();
}

/**
 * GET /merchant/market/traffic-index?window= — category traffic index vs.
 * the merchant's own live-computed transaction volume (plan.md §3). Default
 * window 7d, matching the Lambda's default (the freshest read on a possible
 * shock, per lib/marketPanel.js).
 */
export async function getTrafficIndex(idToken: string, window: TrafficIndexWindow = "7d"): Promise<TrafficIndexResponse> {
  if (MERCHANT_MOCK) return mock.mockGetTrafficIndex(window);
  const res = await authedFetch(`/merchant/market/traffic-index${qs({ window })}`, idToken);
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
