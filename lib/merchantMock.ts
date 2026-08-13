// lib/merchantMock.ts
//
// Realistic mock data for the merchant dashboard (M5, "UI shell vs mock
// immediately" per plan.md milestones — the real merchant-api Lambda is M2,
// separate work). Powers every lib/merchantApi.ts export when
// NEXT_PUBLIC_MERCHANT_MOCK=1, so the whole dashboard is demoable with zero
// backend.
//
// Transactions are built the same way the real pipeline will eventually
// produce them: synthesize a plausible ESC/POS-style `ReceiptLine[]` (same
// shape as sampleReceipt.ts) and run it through the *actual*
// `summarizeReceipt()` heuristics from lib/receiptSummary.ts — not a
// hand-rolled parallel shape. That keeps the mock's ReceiptSummary output
// (and therefore tx/[sid]/page.tsx, which renders it through app/r/ui.tsx's
// real cards) trustworthy as a preview of the real thing.
//
// Determinism: a seeded PRNG (mulberry32), not Math.random(). The dataset is
// built once at module scope from a fixed seed, so server-render and
// client-hydration produce byte-identical output — required because these
// are "use client" pages and Next still does one SSR pass before hydrating.

import { defaultStyle, encodeEscPos, type ReceiptLine, type Style } from "./escpos";
import {
  summarizeReceipt,
  detectPaymentMethod,
  extractLastFour,
  type ReceiptSummary,
  type PaymentNetwork,
} from "./receiptSummary";
// Imports from ./merchantTimezone directly, NOT ./merchantApi -- this file
// is itself imported by merchantApi.ts (`* as mock`), so importing the
// constant back FROM merchantApi.ts would recreate the circular-import
// crash that module exists to avoid. See merchantTimezone.ts's comment.
import { MERCHANT_DISPLAY_TIMEZONE } from "./merchantTimezone";
import type {
  ListTransactionsParams,
  ExportCsvParams,
  MerchantLineItem,
  MerchantTransactionDetail,
  MerchantTransactionSummary,
  MerchantDevice,
  MerchantInsights,
  TapRate,
  TransactionsPage,
  InsightsWindow,
  HourBucket,
  DayOfWeekBucket,
  ParseConfidence,
  ParseStatus,
  CrossShoppingResponse,
  CrossShoppingWindow,
  TrafficIndexResponse,
  TrafficIndexWindow,
  PanelBasis,
  PanelCategory,
  UnservedDemandRow,
} from "./merchantApi";

// ---------------------------------------------------------------------------
// Seeded PRNG
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(0x50415058); // "PAPX"

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// Fixture vocabulary
// ---------------------------------------------------------------------------

const MERCHANT_NAME = "Bluebird Coffee";
const MERCHANT_ADDRESS = ["412 Walnut St", "Syracuse, NY 13202", "(315) 555-0142"];
const SERVERS = ["Maya", "Theo", "Priya", "Sam", "Julian"];

const MENU: { name: string; price: number }[] = [
  { name: "Cortado", price: 4.25 },
  { name: "Oat milk add-on", price: 0.75 },
  { name: "Almond croissant", price: 4.5 },
  { name: "Sparkling water", price: 2.0 },
  { name: "Latte", price: 4.75 },
  { name: "Americano", price: 3.25 },
  { name: "Plain croissant", price: 3.75 },
  { name: "Blueberry muffin", price: 3.95 },
  { name: "Bagel & cream cheese", price: 4.1 },
  { name: "Iced tea", price: 3.0 },
  { name: "Espresso", price: 2.75 },
  { name: "Cappuccino", price: 4.5 },
];

type PaymentFixture = { text: string; last4?: string };
const PAYMENT_FIXTURES: PaymentFixture[] = [
  { text: "VISA  ****4729   APPROVED", last4: "4729" },
  { text: "MASTERCARD  ****8843   APPROVED", last4: "8843" },
  { text: "AMEX  ****1006   APPROVED", last4: "1006" },
  { text: "DISCOVER  ****5521   APPROVED", last4: "5521" },
  { text: "APPLE PAY   APPROVED" },
  { text: "GOOGLE PAY   APPROVED" },
  { text: "CASH" },
];

const DEVICES: { deviceId: string; label: string }[] = [
  { deviceId: "rdh-device-001", label: "Front Counter" },
  { deviceId: "rdh-device-002", label: "Patio Register" },
];

const bigBold: Style = { ...defaultStyle(), bold: true, doubleHeight: true, doubleWidth: true };
const bold: Style = { ...defaultStyle(), bold: true };
const plain: Style = defaultStyle();

function line(text: string, align: ReceiptLine["align"] = "left", style: Style = plain): ReceiptLine {
  return { text, align, style };
}

function money(n: number): string {
  return n.toFixed(2);
}

/** Right-pads a label so a trailing amount lines up, mirroring real ESC/POS receipt formatting. */
function padded(label: string, amount: string, width = 32): string {
  const gap = Math.max(2, width - label.length - amount.length);
  return `${label}${" ".repeat(gap)}${amount}`;
}

// ---------------------------------------------------------------------------
// One synthetic receipt -> real summarizeReceipt() output
// ---------------------------------------------------------------------------

interface BuiltReceipt {
  lines: ReceiptLine[];
  summary: ReceiptSummary;
  itemNames: string[];
  total: number | null;
}

function buildReceipt(opts: { receiptNumber: string; dateline: string; payment: PaymentFixture; itemCount: number }): BuiltReceipt {
  const items = Array.from({ length: opts.itemCount }, () => pick(MENU));
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const lines: ReceiptLine[] = [
    line(MERCHANT_NAME, "center", bigBold),
    ...MERCHANT_ADDRESS.map((a) => line(a, "center", plain)),
    line(""),
    line(`Order #${opts.receiptNumber}   ${opts.dateline}`),
    line(`Server: ${pick(SERVERS)}`),
    line("--------------------------------"),
    ...items.map((item) => line(padded(item.name, money(item.price)))),
    line("--------------------------------"),
    line(padded("Subtotal", money(subtotal))),
    line(padded("Tax (8%)", money(tax))),
    line(padded("TOTAL", money(total)), "left", bold),
    line(""),
    line(opts.payment.text),
    line(""),
    line("Thanks for stopping in!", "center", plain),
  ];

  return { lines, summary: summarizeReceipt(lines), itemNames: items.map((i) => i.name), total };
}

/**
 * A pathological receipt the real parser genuinely can't structure — models
 * `parse_status: "failed"`. Deliberately no A-Z content anywhere (every
 * summarizeReceipt() heuristic requires a letter to anchor on), so
 * `hasStructure` comes back false on its own merit, not via a hardcoded flag.
 */
function buildUnparseableReceipt(): BuiltReceipt {
  const lines: ReceiptLine[] = [
    line("!! ??"),
    line("### // -- %%"),
    line("~~~ ^^^ >>> <<<"),
  ];
  return { lines, summary: summarizeReceipt(lines), itemNames: [], total: null };
}

// ---------------------------------------------------------------------------
// Dataset assembly
// ---------------------------------------------------------------------------

interface MockTxRecord {
  sid: string;
  deviceId: string;
  uploadedAt: string; // ISO
  receiptNumber: string;
  paymentMethod: MerchantTransactionSummary["paymentMethod"];
  cardLast4: string | null;
  merchantName: string | null;
  itemNames: string[];
  total: number | null;
  confidence: ParseConfidence;
  parseStatus: ParseStatus;
  summary: ReceiptSummary;
  rawText: string;
}

const TRANSACTION_COUNT = 46;
const NOW = new Date("2026-07-22T18:00:00.000Z");

function receiptLinesToText(lines: ReceiptLine[]): string {
  return lines
    .map((l) => l.text)
    .filter((t) => t.trim().length > 0)
    .join("\n");
}

function assessConfidence(summary: ReceiptSummary): ParseConfidence {
  const hasEnough = summary.merchantName != null && summary.total != null && summary.items.length > 0;
  return hasEnough ? "high" : "low";
}

function businessHourTimestamp(daysAgo: number): Date {
  // Weighted toward opening (7am) through closing (7pm), local-naive.
  const hour = randInt(7, 19);
  const minute = randInt(0, 59);
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, minute, randInt(0, 59), 0);
  return d;
}

function formatDateline(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const h24 = d.getUTCHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const ampm = h24 < 12 ? "AM" : "PM";
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, 2026  ${h12}:${mm} ${ampm}`;
}

function buildDataset(): MockTxRecord[] {
  const records: MockTxRecord[] = [];

  for (let i = 0; i < TRANSACTION_COUNT; i++) {
    const daysAgo = randInt(0, 29);
    const uploadedAt = businessHourTimestamp(daysAgo);
    const receiptNumber = String(1000 + i);
    const payment = pick(PAYMENT_FIXTURES);
    const itemCount = randInt(1, 5);
    const built = buildReceipt({
      receiptNumber,
      dateline: formatDateline(uploadedAt),
      payment,
      itemCount,
    });

    records.push({
      sid: `mock${String(i).padStart(4, "0")}`,
      deviceId: DEVICES[i % DEVICES.length].deviceId,
      uploadedAt: uploadedAt.toISOString(),
      receiptNumber,
      paymentMethod: detectPaymentMethod(built.summary.paymentLine ?? null),
      cardLast4: payment.last4 ?? extractLastFour(built.summary.paymentLine ?? null),
      merchantName: built.summary.merchantName ?? null,
      itemNames: built.itemNames,
      total: built.summary.total ?? built.total,
      confidence: assessConfidence(built.summary),
      parseStatus: "ok",
      summary: built.summary,
      rawText: receiptLinesToText(built.lines),
    });
  }

  // Force exactly one low-confidence row: totals and items extract fine,
  // but with no leading header line the merchant-name heuristic legitimately
  // finds nothing to anchor on (every other line either ends in an amount or
  // reads as a totals/payment line) — the same failure mode a headerless
  // gas-station or EU receipt hits per the PRD's §9 risk note. `total` and
  // `items` alone aren't "enough" for assessConfidence() below, so this
  // genuinely downgrades to "low" rather than being hardcoded.
  const lowConfidenceLines: ReceiptLine[] = [
    line("--------------------------------"),
    line(padded("Drip coffee", money(2.5))),
    line(padded("Bagel", money(3.25))),
    line("--------------------------------"),
    line(padded("TOTAL", money(5.75)), "left", bold),
    line(""),
    line("CASH"),
  ];
  const lowConfidenceSummary = summarizeReceipt(lowConfidenceLines);
  records.push({
    sid: "mock-lowconf",
    deviceId: DEVICES[0].deviceId,
    uploadedAt: businessHourTimestamp(2).toISOString(),
    receiptNumber: "9001",
    paymentMethod: "cash",
    cardLast4: null,
    merchantName: lowConfidenceSummary.merchantName ?? null,
    itemNames: ["Drip coffee", "Bagel"],
    total: lowConfidenceSummary.total ?? 5.75,
    confidence: "low",
    parseStatus: "ok",
    summary: lowConfidenceSummary,
    rawText: receiptLinesToText(lowConfidenceLines),
  });

  // Force exactly one parse_status: "failed" row — garbled bytes, nothing
  // structured, rawText is all the UI has to show.
  const failed = buildUnparseableReceipt();
  records.push({
    sid: "mock-failed",
    deviceId: DEVICES[1].deviceId,
    uploadedAt: businessHourTimestamp(5).toISOString(),
    receiptNumber: "—",
    paymentMethod: null,
    cardLast4: null,
    merchantName: null,
    itemNames: [],
    total: null,
    confidence: "low",
    parseStatus: "failed",
    summary: failed.summary,
    rawText: receiptLinesToText(failed.lines) || "(no readable text — receipt could not be parsed)",
  });

  records.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1)); // reverse-chron
  return records;
}

const DATASET = buildDataset();

// ---------------------------------------------------------------------------
// Local-hour/day-of-week derivation -- MUST mirror Papex_RDH/lambdas/
// merchant-api/handler.js's uploadedAtParts() exactly (same
// MERCHANT_DISPLAY_TIMEZONE, same Intl.DateTimeFormat approach with
// hourCycle:"h23" for a clean 0-23 range and DST handled by the platform's
// tz database, not a fixed offset). mockGetInsights's byHour/byDayOfWeek
// buckets and mockListTransactions'/mockExportCsv's hour/dow filters both
// call this ONE function so mock mode can never disagree with itself the
// way UTC-vs-local would.
// ---------------------------------------------------------------------------

const HOUR_DOW_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: MERCHANT_DISPLAY_TIMEZONE,
  hourCycle: "h23",
  hour: "numeric",
  weekday: "short",
});
const WEEKDAY_TO_DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function localHourDow(iso: string): { hour: number; dow: number } | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const parts = HOUR_DOW_FORMATTER.formatToParts(d);
  const hourStr = parts.find((p) => p.type === "hour")?.value;
  const weekdayStr = parts.find((p) => p.type === "weekday")?.value;
  if (hourStr === undefined || weekdayStr === undefined) return null;
  const dow = WEEKDAY_TO_DOW[weekdayStr];
  if (dow === undefined) return null;
  return { hour: Number(hourStr), dow };
}

// ---------------------------------------------------------------------------
// Server-side-equivalent filtering -- mirrors Papex_RDH/lambdas/merchant-api/
// handler.js's parseTransactionFilter/matchesTransactionFilter closely
// enough to be a faithful preview: q/minAmount/maxAmount/hour/dow/device, a
// null total never satisfies an amount filter, q matches merchantName/
// receiptNumber/cardLast4/item names case-insensitively. A filter UI that
// silently no-ops in mock mode would be worse than no mock at all.
// ---------------------------------------------------------------------------

interface RecordFilter {
  q?: string;
  minAmount?: number;
  maxAmount?: number;
  hour?: number;
  dow?: number;
  device?: string;
}

type FilterableParams = Pick<ListTransactionsParams, "q" | "minAmount" | "maxAmount" | "hour" | "dow" | "device">;

function buildRecordFilter(params: FilterableParams): RecordFilter {
  const filter: RecordFilter = {};
  if (params.q && params.q.trim() !== "") filter.q = params.q.trim().toLowerCase();
  if (params.minAmount != null) filter.minAmount = params.minAmount;
  if (params.maxAmount != null) filter.maxAmount = params.maxAmount;
  if (params.hour != null) filter.hour = params.hour;
  if (params.dow != null) filter.dow = params.dow;
  if (params.device && params.device.trim() !== "") filter.device = params.device.trim();
  return filter;
}

function matchesRecordFilter(r: MockTxRecord, filter: RecordFilter): boolean {
  if (filter.minAmount !== undefined || filter.maxAmount !== undefined) {
    if (r.total == null) return false;
    if (filter.minAmount !== undefined && r.total < filter.minAmount) return false;
    if (filter.maxAmount !== undefined && r.total > filter.maxAmount) return false;
  }
  if (filter.hour !== undefined || filter.dow !== undefined) {
    const parts = localHourDow(r.uploadedAt);
    if (parts === null) return false;
    if (filter.hour !== undefined && parts.hour !== filter.hour) return false;
    if (filter.dow !== undefined && parts.dow !== filter.dow) return false;
  }
  if (filter.device !== undefined && r.deviceId !== filter.device) return false;
  if (filter.q !== undefined) {
    const haystacks = [r.merchantName ?? "", r.receiptNumber ?? "", r.cardLast4 ?? "", ...r.itemNames];
    if (!haystacks.some((h) => h.toLowerCase().includes(filter.q!))) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Public mock API — mirrors lib/merchantApi.ts's real endpoints 1:1
// ---------------------------------------------------------------------------

function toSummary(r: MockTxRecord): MerchantTransactionSummary {
  return {
    sid: r.sid,
    deviceId: r.deviceId,
    uploadedAt: r.uploadedAt,
    total: r.total,
    paymentMethod: r.paymentMethod,
    cardLast4: r.cardLast4,
    receiptNumber: r.receiptNumber,
    merchantName: r.merchantName,
    itemsPreview: r.itemNames.join(", "),
    confidence: r.confidence,
    parseStatus: r.parseStatus,
  };
}

const PAGE_SIZE = 15;

export async function mockListTransactions(params: ListTransactionsParams): Promise<TransactionsPage> {
  let rows = DATASET;
  if (params.from) rows = rows.filter((r) => r.uploadedAt >= params.from!);
  if (params.to) rows = rows.filter((r) => r.uploadedAt <= params.to! + "T23:59:59.999Z");

  const filter = buildRecordFilter(params);
  const matched = rows.filter((r) => matchesRecordFilter(r, filter));

  const start = params.cursor ? Number(params.cursor) : 0;
  const limit = params.limit ?? PAGE_SIZE;
  const page = matched.slice(start, start + limit);
  const nextCursor = start + limit < matched.length ? String(start + limit) : null;

  // Mock mode's dataset is small enough that the filtered walk is always
  // exhaustive within one call (no DynamoDB-style partition-page cap to
  // simulate), so pageCapped is always false. matchedCount is deliberately
  // ALWAYS null here too, matching the real endpoint's contract exactly
  // (see TransactionsPage.matchedCount's comment) — call
  // mockCountTransactions()/listTransactionsCount() separately, same as a
  // real caller has to. Mock mode has no perf reason to defer the count
  // (this dataset is tiny), but the UI's "list renders now, count fills in
  // later" behavior needs to be exercised in the demo too, not just against
  // the real backend.
  return { transactions: page.map(toSummary), nextCursor, matchedCount: null, pageCapped: false };
}

/** Mirrors GET /merchant/transactions?countOnly=1 — see listTransactionsCount(). */
export async function mockCountTransactions(params: Pick<ListTransactionsParams, "from" | "to" | "q" | "minAmount" | "maxAmount" | "hour" | "dow" | "device">): Promise<number> {
  let rows = DATASET;
  if (params.from) rows = rows.filter((r) => r.uploadedAt >= params.from!);
  if (params.to) rows = rows.filter((r) => r.uploadedAt <= params.to! + "T23:59:59.999Z");
  const filter = buildRecordFilter(params);
  return rows.filter((r) => matchesRecordFilter(r, filter)).length;
}

// Mirrors Papex_RDH/lambdas/indexer/lib/summarize.js's
// PAYMENT_TYPE_TO_CARD_BRAND — maps a detected card network onto the
// display card-brand string; wallet/ACH types (apple_pay, cash, venmo, ...)
// intentionally have no brand.
const NETWORK_TO_CARD_BRAND: Partial<Record<PaymentNetwork, string>> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
  diners_club: "Diners",
  jcb: "JCB",
  unionpay: "UnionPay",
};

function toLineItems(summary: ReceiptSummary): MerchantLineItem[] {
  return summary.items.map((it) => ({ name: it.name, quantity: it.qty, price: it.amount }));
}

export async function mockGetTransaction(sid: string): Promise<MerchantTransactionDetail | null> {
  const r = DATASET.find((row) => row.sid === sid);
  if (!r) return null;
  return {
    sid: r.sid,
    uploadedAt: r.uploadedAt,
    deviceId: r.deviceId,
    parseStatus: r.parseStatus,
    confidence: r.confidence,
    total: r.total,
    subtotal: r.summary.subtotal ?? null,
    tax: r.summary.tax ?? null,
    receiptNumber: r.receiptNumber,
    paymentMethod: r.paymentMethod,
    cardBrand: r.paymentMethod ? (NETWORK_TO_CARD_BRAND[r.paymentMethod] ?? null) : null,
    cardLast4: r.cardLast4,
    lineItems: toLineItems(r.summary),
    rawText: r.rawText,
  };
}

/**
 * GET /merchant/receipt/{sid} mock — synthesizes raw ESC/POS bytes from the
 * same ReceiptLine[] (`summary.bodyLines`) `buildReceipt()` fed into
 * summarizeReceipt() when the dataset was built, via lib/escpos.ts's
 * encodeEscPos(). This keeps mock mode exercising the exact same
 * "fetch bytes -> parseEscPos -> summarizeReceipt" path the real backend
 * will (app/merchant/tx/[sid]/page.tsx), rather than a parallel mock-only
 * rendering path.
 */
export async function mockGetReceiptBytes(sid: string): Promise<Uint8Array> {
  const r = DATASET.find((row) => row.sid === sid);
  if (!r) throw new Error(`mock receipt not found: ${sid}`);
  return encodeEscPos(r.summary.bodyLines);
}

export async function mockListDevices(): Promise<MerchantDevice[]> {
  const freshest = new Map<string, string>();
  for (const r of DATASET) {
    const prev = freshest.get(r.deviceId);
    if (!prev || r.uploadedAt > prev) freshest.set(r.deviceId, r.uploadedAt);
  }
  return DEVICES.map((d) => {
    const lastUploadAt = freshest.get(d.deviceId) ?? null;
    const hoursSince = lastUploadAt ? (NOW.getTime() - new Date(lastUploadAt).getTime()) / 3_600_000 : Infinity;
    const status: MerchantDevice["status"] = lastUploadAt === null ? "never" : hoursSince > 12 ? "stale" : "ok";
    return { deviceId: d.deviceId, label: d.label, lastUploadAt, status };
  });
}

function windowStart(window: InsightsWindow): Date {
  const d = new Date(NOW);
  if (window === "today") {
    d.setUTCHours(0, 0, 0, 0);
  } else if (window === "7d") {
    d.setUTCDate(d.getUTCDate() - 7);
  } else {
    d.setUTCDate(d.getUTCDate() - 30);
  }
  return d;
}

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function mockGetInsights(window: InsightsWindow): Promise<MerchantInsights> {
  const since = windowStart(window).toISOString();
  const rows = DATASET.filter((r) => r.uploadedAt >= since && r.parseStatus === "ok" && r.total != null);

  const count = rows.length;
  const gross = Math.round(rows.reduce((s, r) => s + (r.total ?? 0), 0) * 100) / 100;
  const avgTicket = count > 0 ? Math.round((gross / count) * 100) / 100 : 0;

  const byHour: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0, gross: 0 }));
  const byDayOfWeek: DayOfWeekBucket[] = Array.from({ length: 7 }, (_, day) => ({
    day,
    label: DOW_LABELS[day],
    count: 0,
    gross: 0,
  }));
  const itemCounts = new Map<string, number>();

  for (const r of rows) {
    // Shared with matchesRecordFilter's hour/dow query filters — see
    // localHourDow's comment for why these two MUST stay in lockstep.
    const parts = localHourDow(r.uploadedAt);
    if (parts !== null) {
      const hourBucket = byHour[parts.hour];
      hourBucket.count += 1;
      hourBucket.gross = Math.round((hourBucket.gross + (r.total ?? 0)) * 100) / 100;

      const dowBucket = byDayOfWeek[parts.dow];
      dowBucket.count += 1;
      dowBucket.gross = Math.round((dowBucket.gross + (r.total ?? 0)) * 100) / 100;
    }

    for (const name of r.itemNames) {
      itemCounts.set(name, (itemCounts.get(name) ?? 0) + 1);
    }
  }

  const topItems = [...itemCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, itemCount]) => ({ name, count: itemCount }));

  return { window, count, gross, avgTicket, byHour, byDayOfWeek, topItems, timezone: MERCHANT_DISPLAY_TIMEZONE };
}

export async function mockGetTapRate(window: InsightsWindow): Promise<TapRate> {
  const since = windowStart(window).toISOString();
  const total = DATASET.filter((r) => r.uploadedAt >= since).length;
  // Deterministic plausible rate rather than another RNG draw, so this
  // stays stable across window toggles within a single render.
  const claimed = Math.round(total * 0.58);
  return { window, rate: total > 0 ? Math.round((claimed / total) * 1000) / 10 : null, claimed, total };
}

// ---------------------------------------------------------------------------
// Market intelligence panel mocks (plan.md §3/§6). Deliberately include ONE
// suppressed metric (the traffic index, own-side floor) and ONE hidden row
// (unservedDemand's "bubble_tea" row) — plan.md §6: "must include one
// suppressed metric and one hidden row, else the suppressed state ships
// untested by eye." Self-contained (does not import Papex_RDH's
// lib/marketPanel.js — different repo/runtime), but the shapes and wording
// mirror it closely enough to be a faithful preview of the real response.
// ---------------------------------------------------------------------------

const MARKET_CATEGORY: PanelCategory = { id: "coffee_shop", label: "Coffee shop" };
const MARKET_DATA_SOURCE = "demo_panel";
const MARKET_DISCLOSURE =
  "This section reflects a synthetic demo panel (a modeled category cohort and shopper population), not real competitor data. No competitor is ever named — every figure is a category-level aggregate.";
const MARKET_COHORT_MERCHANTS = 46;
const MARKET_PANEL_SHOPPERS = 1600;
const MARKET_CONTRIBUTING_SHOPPERS = 512;

function isoDaysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

function marketBasis(days: number, merchants: number, shoppers: number | null, suppressed: boolean): PanelBasis {
  const label = suppressed
    ? "Not enough category data yet for a reliable comparison."
    : `Based on ${merchants} ${merchants === 1 ? "business" : "businesses"} and ${shoppers} ${shoppers === 1 ? "shopper" : "shoppers"} in your category.`;
  return {
    merchants,
    shoppers: suppressed ? null : shoppers,
    windowStart: isoDaysAgo(days),
    windowEnd: NOW.toISOString(),
    label,
  };
}

const MOCK_DEMAND_ROWS: { row: Omit<UnservedDemandRow, "basis">; merchants: number; shoppers: number; hidden: boolean }[] = [
  {
    row: { categoryId: "breakfast_sandwiches", categoryLabel: "Breakfast sandwiches", carriedByYou: false, spendPerShopperMonth: 12.4, shopperPenetrationPct: 44.2 },
    merchants: 8,
    shoppers: 704,
    hidden: false,
  },
  {
    row: { categoryId: "packaged_coffee", categoryLabel: "Packaged coffee beans", carriedByYou: false, spendPerShopperMonth: 9.1, shopperPenetrationPct: 19.3 },
    merchants: 6,
    shoppers: 309,
    hidden: false,
  },
  {
    row: { categoryId: "smoothies_cold_pressed", categoryLabel: "Smoothies / cold-pressed juice", carriedByYou: false, spendPerShopperMonth: 7.6, shopperPenetrationPct: 15.8 },
    merchants: 6,
    shoppers: 253,
    hidden: false,
  },
  {
    row: { categoryId: "deli_sandwiches_lunch", categoryLabel: "Deli sandwiches & lunch", carriedByYou: false, spendPerShopperMonth: 6.2, shopperPenetrationPct: 8.7 },
    merchants: 5,
    shoppers: 139,
    hidden: false,
  },
  {
    // Deliberately below MIN_MERCHANTS(5) -- the one hidden row plan.md §6 requires.
    row: { categoryId: "bubble_tea", categoryLabel: "Bubble tea", carriedByYou: false, spendPerShopperMonth: 4.4, shopperPenetrationPct: 5.1 },
    merchants: 3,
    shoppers: 81,
    hidden: true,
  },
];

export async function mockGetCrossShopping(window: CrossShoppingWindow): Promise<CrossShoppingResponse> {
  const days = window === "90d" ? 90 : 30;
  const currentPct = 41;
  // 90d dilutes the trend the same way the real seeder's window comparison
  // does (a wider window mixes in more of the pre-trend period).
  const priorPct = window === "90d" ? 44 : 47;

  const visibleRows = MOCK_DEMAND_ROWS.filter((r) => !r.hidden);
  const hiddenRowCount = MOCK_DEMAND_ROWS.length - visibleRows.length;

  return {
    window,
    generatedAt: isoDaysAgo(0),
    dataSource: MARKET_DATA_SOURCE,
    category: MARKET_CATEGORY,
    shareOfWallet: {
      status: "ok",
      value: { currentPct, priorPct, deltaPct: Math.round((currentPct - priorPct) * 10) / 10 },
      basis: marketBasis(days, MARKET_COHORT_MERCHANTS, MARKET_CONTRIBUTING_SHOPPERS, false),
    },
    competitiveSet: {
      status: "ok",
      value: { yourShoppersVenuesPerMonth: 2.41, categoryAvgVenuesPerMonth: 2.63 },
      basis: marketBasis(days, MARKET_COHORT_MERCHANTS, MARKET_CONTRIBUTING_SHOPPERS, false),
    },
    unservedDemand: {
      status: "ok",
      value: {
        rows: visibleRows.map(({ row, merchants, shoppers }) => ({ ...row, basis: marketBasis(days, merchants, shoppers, false) })),
        hiddenRowCount,
      },
      basis: marketBasis(days, MARKET_COHORT_MERCHANTS, MARKET_PANEL_SHOPPERS, false),
    },
    disclosure: MARKET_DISCLOSURE,
  };
}

export async function mockGetTrafficIndex(window: TrafficIndexWindow): Promise<TrafficIndexResponse> {
  const days = window === "30d" ? 30 : 7;

  // The ONE suppressed metric plan.md §6 requires: own-side floor (< 30
  // transactions in the current OR prior period) suppresses the whole
  // index even though the category side has data — the same "whole index
  // suppresses" behavior lib/marketPanel.js implements server-side.
  return {
    window,
    generatedAt: isoDaysAgo(0),
    dataSource: MARKET_DATA_SOURCE,
    category: MARKET_CATEGORY,
    index: {
      status: "suppressed",
      value: null,
      basis: marketBasis(days, MARKET_COHORT_MERCHANTS, MARKET_PANEL_SHOPPERS, true),
      reason: "no_data",
      message:
        "We don't have enough of your own recent transaction volume yet to compare against the category trend. This unlocks automatically as more of your receipts are recorded.",
    },
    yourBasis: null,
    disclosure: MARKET_DISCLOSURE,
  };
}

export function mockExportCsv(params: ExportCsvParams): string {
  let rows = DATASET;
  if (params.from) rows = rows.filter((r) => r.uploadedAt >= params.from!);
  if (params.to) rows = rows.filter((r) => r.uploadedAt <= params.to! + "T23:59:59.999Z");

  // Same filters as mockListTransactions -- exporting a filtered view must
  // not silently export the whole (unfiltered) dataset.
  const filter = buildRecordFilter(params);
  rows = rows.filter((r) => matchesRecordFilter(r, filter));

  const header = [
    "sid",
    "uploaded_at",
    "device_id",
    "receipt_number",
    "total",
    "payment_method",
    "card_last4",
    "confidence",
    "parse_status",
    "items",
  ];
  const body = rows.map((r) =>
    [
      r.sid,
      r.uploadedAt,
      r.deviceId,
      r.receiptNumber,
      r.total != null ? r.total.toFixed(2) : "",
      r.paymentMethod ?? "",
      r.cardLast4 ?? "",
      r.confidence,
      r.parseStatus,
      `"${r.itemNames.join("; ")}"`,
    ].join(",")
  );
  return [header.join(","), ...body].join("\n");
}
