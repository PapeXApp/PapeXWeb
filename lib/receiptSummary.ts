// lib/receiptSummary.ts
//
// Best-effort structuring of a parsed `Receipt` (flat ESC/POS text lines,
// see lib/escpos.ts) into the fields the RDH web viewer's "designed" cards
// show: merchant, address, date, line items, totals, and payment method.
//
// This is a line-for-line port of the Swift heuristics at
// Papex_AppClip/Sources/AppClip/ReceiptSummary.swift, kept close to parity
// on purpose (see docs/rdh_orchestrator.md decision #4 — shared JSON
// intermediate schema / parity between clients). ESC/POS is freeform text,
// so every field here is optional, and the caller must degrade gracefully:
// when nothing structures, `hasStructure` is false and the page should fall
// back to the verbatim "Original receipt" monospace body (which
// `bodyLines` always preserves).
//
// The payment-method chip styling (detectPaymentMethod / extractLastFour /
// PAYMENT_METHOD_STYLES) is a separate port from
// PapeXV2/app/receiptDetail.tsx (~lines 50-101) — that file structures
// already-structured API data (a `paymentMethod` string field), whereas
// here we first have to *find* that string inside the flat line stream via
// `extractPayment` below, then run it through the same brand-detection
// table so the rendered chip is pixel-identical to the app.

import type { ReceiptLine } from "./escpos";

export interface ReceiptLineItem {
  /** Raw label text before the trailing amount, e.g. "1  Cortado". */
  label: string;
  /** Best-effort item name with a leading "<qty>  " stripped, if present. */
  name: string;
  qty: number;
  amount: number;
}

export interface ReceiptSummary {
  merchantName?: string;
  addressLines: string[];
  dateline?: string;
  items: ReceiptLineItem[];
  subtotal?: number;
  tax?: number;
  tip?: number;
  discount?: number;
  total?: number;
  paymentLine?: string;
  /** The full, verbatim receipt body for the monospace fallback view. */
  bodyLines: ReceiptLine[];
}

/** True when enough structure was extracted to show designed cards instead of only the raw body. */
export function hasStructure(summary: ReceiptSummary): boolean {
  return summary.merchantName != null || summary.total != null || summary.items.length > 0;
}

// ---------------------------------------------------------------------------
// Regex patterns — ported verbatim from ReceiptSummary.swift's `Patterns` enum.
// ---------------------------------------------------------------------------

/** Amount at end of line, optional $ and thousands separators, exactly 2 decimals. */
const TRAILING_MONEY_RE = /\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})\s*$/;

/** A date somewhere in the line: "Jun 8, 2026", "06/08/2026", or "2026-06-08". */
const DATE_RE =
  /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2}/i;

function isDivider(t: string): boolean {
  const stripped = t.replace(/\s+/g, "");
  if (stripped.length < 3) return false;
  return /^[-=_*]+$/.test(stripped);
}

function looksLikeTotal(t: string): boolean {
  const l = t.toLowerCase();
  return (
    l.includes("subtotal") ||
    l.includes("sub total") ||
    l.includes("total") ||
    l.includes("tax") ||
    l.includes("vat") ||
    l.includes("gst") ||
    l.includes("amount due") ||
    l.includes("balance") ||
    l.includes("change") ||
    l.includes("tip") ||
    l.includes("gratuity") ||
    l.includes("cash")
  );
}

const PAYMENT_BRAND_HINTS = [
  "visa",
  "mastercard",
  "master card",
  "amex",
  "american express",
  "discover",
  "debit",
  "credit",
  "apple pay",
  "google pay",
  "paypal",
  "venmo",
  "approved",
  "card ****",
  "xxxx",
  "****",
];

function looksLikePayment(t: string): boolean {
  const l = t.toLowerCase();
  return PAYMENT_BRAND_HINTS.some((brand) => l.includes(brand));
}

function looksLikeOrderLine(t: string): boolean {
  const l = t.toLowerCase();
  return (
    l.includes("order") ||
    l.includes("server") ||
    l.includes("table") ||
    l.includes("cashier") ||
    l.includes("receipt #") ||
    l.includes("invoice")
  );
}

/** A trailing monetary amount, e.g. "...  12.42" or "$1,234.50" -> number. */
export function trailingAmount(t: string): number | undefined {
  const match = t.match(TRAILING_MONEY_RE);
  if (!match) return undefined;
  const raw = match[0].replace(/\$/g, "").replace(/,/g, "").trim();
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** Everything before the trailing amount, trimmed; undefined if nothing remains. */
export function leadingLabel(t: string): string | undefined {
  const match = t.match(TRAILING_MONEY_RE);
  if (!match || match.index == null) return undefined;
  const label = t.slice(0, match.index).trim();
  return label.length === 0 ? undefined : label;
}

function endsWithAmount(t: string): boolean {
  return trailingAmount(t) !== undefined;
}

// ---------------------------------------------------------------------------
// Merchant / address / date
// ---------------------------------------------------------------------------

function extractMerchant(lines: ReceiptLine[]): { name?: string; index?: number } {
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].text.trim();
    if (!t) continue;
    if (isDivider(t)) continue;
    // Conventionally the merchant prints first, centered and/or large.
    // Accept the first non-empty, non-divider line that looks like a name
    // (has letters, isn't a total/price line).
    if (/[A-Za-z]/.test(t) && !looksLikeTotal(t) && !endsWithAmount(t)) {
      return { name: t, index: i };
    }
  }
  return {};
}

function extractAddress(lines: ReceiptLine[], merchantIndex?: number): string[] {
  if (merchantIndex == null) return [];
  const out: string[] = [];
  let i = merchantIndex + 1;
  while (i < lines.length && out.length < 3) {
    const line = lines[i];
    const t = line.text.trim();
    i += 1;
    if (!t) break; // blank line ends the header block
    if (isDivider(t)) break;
    // Address/contact lines are centered, short, and not money rows.
    const centeredish = line.align === "center" || t.length <= 34;
    if (centeredish && !endsWithAmount(t) && !looksLikeTotal(t) && !looksLikeOrderLine(t)) {
      out.push(t);
    } else {
      break;
    }
  }
  return out;
}

function extractDateline(lines: ReceiptLine[]): string | undefined {
  for (const line of lines) {
    const t = line.text.trim();
    if (!t) continue;
    if (DATE_RE.test(t)) return t;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Totals — subtotal/tax/tip/discount/total via keyword + trailing-amount scan.
// The Swift version also had a "prefer parser-provided totals" fast path fed
// by ReceiptTotals off the sample receipt; the TS parser (lib/escpos.ts)
// doesn't carry a `totals` side-channel, so this always scans lines — which
// also correctly recovers the sample receipt's totals from its text.
// ---------------------------------------------------------------------------

function extractTotals(lines: ReceiptLine[]): {
  subtotal?: number;
  tax?: number;
  tip?: number;
  discount?: number;
  total?: number;
} {
  let subtotal: number | undefined;
  let tax: number | undefined;
  let tip: number | undefined;
  let discount: number | undefined;
  let total: number | undefined;

  for (const line of lines) {
    const t = line.text.trim();
    const amount = trailingAmount(t);
    if (amount === undefined) continue;
    const lower = t.toLowerCase();
    if (lower.includes("subtotal") || lower.includes("sub total")) {
      subtotal = amount;
    } else if (lower.includes("tax") || lower.includes("vat") || lower.includes("gst")) {
      tax = amount;
    } else if (lower.includes("tip") || lower.includes("gratuity")) {
      tip = amount;
    } else if (lower.includes("discount") || lower.includes("rebate")) {
      discount = amount;
    } else if (lower.includes("total") || lower.includes("amount due") || lower.includes("balance due")) {
      total = amount; // last wins -> grand total beats interim totals
    }
  }
  return { subtotal, tax, tip, discount, total };
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

/** "1  Cortado" -> { qty: 1, name: "Cortado" }. No leading integer -> qty 1, name = label. */
function splitQtyAndName(label: string): { qty: number; name: string } {
  const match = label.match(/^(\d+)\s+(.+)$/);
  if (match) {
    const qty = Number(match[1]);
    if (Number.isFinite(qty) && qty > 0) {
      return { qty, name: match[2].trim() };
    }
  }
  return { qty: 1, name: label };
}

function extractItems(lines: ReceiptLine[]): ReceiptLineItem[] {
  const out: ReceiptLineItem[] = [];
  for (const line of lines) {
    const t = line.text.trim();
    if (!t || isDivider(t)) continue;
    if (looksLikeTotal(t) || looksLikePayment(t)) continue;
    const amount = trailingAmount(t);
    if (amount === undefined) continue;
    const label = leadingLabel(t);
    if (!label || !/[A-Za-z]/.test(label)) continue;
    const { qty, name } = splitQtyAndName(label);
    out.push({ label, name, qty, amount });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

function extractPaymentLine(lines: ReceiptLine[]): string | undefined {
  for (const line of lines) {
    const t = line.text.trim();
    if (!t) continue;
    if (looksLikePayment(t)) return t;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Summarize entry point
// ---------------------------------------------------------------------------

export function summarizeReceipt(lines: ReceiptLine[]): ReceiptSummary {
  const merchant = extractMerchant(lines);
  const addressLines = extractAddress(lines, merchant.index);
  const dateline = extractDateline(lines);
  const totals = extractTotals(lines);
  const items = extractItems(lines);
  const paymentLine = extractPaymentLine(lines);

  return {
    merchantName: merchant.name,
    addressLines,
    dateline,
    items,
    subtotal: totals.subtotal,
    tax: totals.tax,
    tip: totals.tip,
    discount: totals.discount,
    total: totals.total,
    paymentLine,
    bodyLines: lines,
  };
}

// ---------------------------------------------------------------------------
// Payment-method chip detection — ported from
// PapeXV2/app/receiptDetail.tsx detectPaymentMethod/extractLastFour/
// PAYMENT_METHOD_STYLES (~lines 50-101), operating on `paymentLine` above
// instead of an API-provided `paymentMethod` field.
// ---------------------------------------------------------------------------

export type PaymentNetwork =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "diners_club"
  | "jcb"
  | "unionpay"
  | "maestro"
  | "apple_pay"
  | "google_pay"
  | "paypal"
  | "venmo"
  | "cash_app"
  | "cash"
  | "ebt"
  | "check";

export function detectPaymentMethod(paymentMethod: string | null | undefined): PaymentNetwork | null {
  if (!paymentMethod) return null;
  const lower = paymentMethod.toLowerCase();
  if (lower.includes("apple pay")) return "apple_pay";
  if (lower.includes("google pay") || lower.includes("gpay")) return "google_pay";
  if (lower.includes("paypal")) return "paypal";
  if (lower.includes("venmo")) return "venmo";
  if (lower.includes("cash app") || lower.includes("cashapp")) return "cash_app";
  if (lower.includes("ebt") || lower.includes("food stamp")) return "ebt";
  if (lower.includes("check") || lower.includes("cheque")) return "check";
  if (lower === "cash" || lower.includes(" cash ")) return "cash";
  if (lower.includes("visa")) return "visa";
  if (lower.includes("mastercard") || lower.includes("master card")) return "mastercard";
  if (lower.includes("amex") || lower.includes("american express")) return "amex";
  if (lower.includes("discover")) return "discover";
  if (lower.includes("diners club") || lower.includes("diners")) return "diners_club";
  if (lower.includes("jcb")) return "jcb";
  if (lower.includes("unionpay") || lower.includes("china unionpay")) return "unionpay";
  if (lower.includes("maestro")) return "maestro";
  return null;
}

export const PAYMENT_METHOD_STYLES: Record<PaymentNetwork, { bg: string; label: string; textColor: string }> = {
  visa: { bg: "#1A1F71", label: "VISA", textColor: "#FFFFFF" },
  mastercard: { bg: "#EB001B", label: "MASTERCARD", textColor: "#FFFFFF" },
  amex: { bg: "#007BC1", label: "AMEX", textColor: "#FFFFFF" },
  discover: { bg: "#F9A021", label: "DISCOVER", textColor: "#FFFFFF" },
  diners_club: { bg: "#0069AA", label: "DINERS", textColor: "#FFFFFF" },
  jcb: { bg: "#0F4C81", label: "JCB", textColor: "#FFFFFF" },
  unionpay: { bg: "#D22630", label: "UNIONPAY", textColor: "#FFFFFF" },
  maestro: { bg: "#0099DF", label: "MAESTRO", textColor: "#FFFFFF" },
  apple_pay: { bg: "#000000", label: "APPLE PAY", textColor: "#FFFFFF" },
  google_pay: { bg: "#4285F4", label: "G PAY", textColor: "#FFFFFF" },
  paypal: { bg: "#003087", label: "PAYPAL", textColor: "#FFFFFF" },
  venmo: { bg: "#008CFF", label: "VENMO", textColor: "#FFFFFF" },
  cash_app: { bg: "#00D632", label: "CASH APP", textColor: "#FFFFFF" },
  cash: { bg: "#22C55E", label: "CASH", textColor: "#FFFFFF" },
  ebt: { bg: "#4CAF50", label: "EBT", textColor: "#FFFFFF" },
  check: { bg: "#6B7280", label: "CHECK", textColor: "#FFFFFF" },
};

export function extractLastFour(paymentMethod: string | null | undefined): string | null {
  if (!paymentMethod) return null;
  const match =
    paymentMethod.match(/ending\s+in\s+(\d{4})/i) ||
    paymentMethod.match(/\*{3,}(\d{4})/) ||
    paymentMethod.match(/(\d{4})$/);
  return match ? match[1] : null;
}
