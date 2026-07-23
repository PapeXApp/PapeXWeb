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

import { defaultStyle, type ReceiptLine, type Style } from "./escpos";
import {
  summarizeReceipt,
  hasStructure as computeHasStructure,
  detectPaymentMethod,
  extractLastFour,
  type ReceiptSummary,
} from "./receiptSummary";
import type {
  ListTransactionsParams,
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

  const start = params.cursor ? Number(params.cursor) : 0;
  const limit = params.limit ?? PAGE_SIZE;
  const page = rows.slice(start, start + limit);
  const nextCursor = start + limit < rows.length ? String(start + limit) : null;

  return { transactions: page.map(toSummary), nextCursor };
}

export async function mockGetTransaction(sid: string): Promise<MerchantTransactionDetail | null> {
  const r = DATASET.find((row) => row.sid === sid);
  if (!r) return null;
  return {
    ...toSummary(r),
    receipt: r.summary,
    hasStructure: computeHasStructure(r.summary),
    rawText: r.rawText,
  };
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
    const d = new Date(r.uploadedAt);
    const hourBucket = byHour[d.getUTCHours()];
    hourBucket.count += 1;
    hourBucket.gross = Math.round((hourBucket.gross + (r.total ?? 0)) * 100) / 100;

    const dowBucket = byDayOfWeek[d.getUTCDay()];
    dowBucket.count += 1;
    dowBucket.gross = Math.round((dowBucket.gross + (r.total ?? 0)) * 100) / 100;

    for (const name of r.itemNames) {
      itemCounts.set(name, (itemCounts.get(name) ?? 0) + 1);
    }
  }

  const topItems = [...itemCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, itemCount]) => ({ name, count: itemCount }));

  return { window, count, gross, avgTicket, byHour, byDayOfWeek, topItems };
}

export async function mockGetTapRate(window: InsightsWindow): Promise<TapRate> {
  const since = windowStart(window).toISOString();
  const total = DATASET.filter((r) => r.uploadedAt >= since).length;
  // Deterministic plausible rate rather than another RNG draw, so this
  // stays stable across window toggles within a single render.
  const claimed = Math.round(total * 0.58);
  return { window, rate: total > 0 ? Math.round((claimed / total) * 1000) / 10 : null, claimed, total };
}

export function mockExportCsv(params: { from?: string; to?: string }): string {
  let rows = DATASET;
  if (params.from) rows = rows.filter((r) => r.uploadedAt >= params.from!);
  if (params.to) rows = rows.filter((r) => r.uploadedAt <= params.to! + "T23:59:59.999Z");

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
