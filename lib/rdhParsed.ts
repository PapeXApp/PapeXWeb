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
import { defaultStyle, type ReceiptLine } from "./escpos";
import type { ReceiptSummary } from "./receiptSummary";


/** Per-item shape returned by the parsed endpoint. */
export interface ParsedLineItem {
  name: string;
  quantity: number;
  price: number;
  sku: string | null;
  /** Per-line discount, NEGATIVE (RDH convention); null when none printed. */
  discount: number | null;
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
  /** The receipt as text, redacted by the indexer before storage. */
  rawText: string | null;
  // ---- Dutchie r2 (Papex_RDH_Backend feat/dutchie-extractor-r2). Every one
  // is optional on the wire; a row without them normalises to []/null and
  // renders exactly as before.
  /** Each printed tax line, e.g. {label: "CA Sales 8.625%", amount: 3.18}. Dollars. */
  taxComponents: AmountLine[];
  /** Each printed fee line, e.g. {label: "Pay By Bank Fee", amount: 0.26}. Dollars. */
  fees: AmountLine[];
  /** The printed "Total Discount" (item + cart), as a positive dollar amount. */
  discountTotal: number | null;
  /** The receipt's loyalty block, when one was printed. */
  loyalty: ParsedLoyalty | null;
}

/** One printed label + amount line (a tax component or a fee). */
export interface AmountLine {
  label: string;
  amount: number;
}

/**
 * - `enrolled` true: a member; the points fields are what the paper printed.
 *   false: printed "Not opted-into program". null: unknown (no loyalty block,
 *   or one this extractor could not read) and nothing is shown.
 * - points are decimals as printed (0.96, 13.30), never cents.
 */
export interface ParsedLoyalty {
  enrolled: boolean | null;
  pointsEarned: number | null;
  pointsRedeemed: number | null;
  pointsBalance: number | null;
  tier: string | null;
  programName: string | null;
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
          discount: num(li.discount),
        }))
      : [],
    paymentMethod: str(raw.paymentMethod),
    cardBrand: str(raw.cardBrand),
    cardLast4: str(raw.cardLast4),
    receiptNumber: str(raw.receiptNumber),
    confidence: str(raw.confidence),
    extractorEngine: str(raw.extractorEngine),
    // Not str(): leading blank lines and indentation are part of the layout.
    rawText: typeof raw.rawText === "string" && raw.rawText.trim() !== "" ? raw.rawText : null,
    taxComponents: amountLines(raw.taxComponents),
    fees: amountLines(raw.fees),
    discountTotal: absOrNull(num(raw.discountTotal)),
    loyalty: normalizeLoyalty(raw.loyalty),
  };
}

function amountLines(raw: unknown): AmountLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isRecord)
    .map((c) => ({ label: str(c.label), amount: num(c.amount) }))
    .filter((c): c is AmountLine => c.label != null && c.amount != null);
}

function absOrNull(n: number | null): number | null {
  return n == null ? null : Math.abs(n);
}

function normalizeLoyalty(raw: unknown): ParsedLoyalty | null {
  if (!isRecord(raw)) return null;
  return {
    enrolled: typeof raw.enrolled === "boolean" ? raw.enrolled : null,
    pointsEarned: num(raw.pointsEarned),
    pointsRedeemed: num(raw.pointsRedeemed),
    pointsBalance: num(raw.pointsBalance),
    tier: str(raw.tier),
    programName: str(raw.programName),
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
  if (receipt.extractorEngine === DUTCHIE_ENGINE) return dutchieToSummary(receipt);
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

// ---- Dutchie (text ESC/POS, read by the indexer's lib/dutchieReceipt.js) ----
//
// A Dutchie receipt is TEXT, so the page could parse it locally — but the
// generic text parser names every item "@ 25.00 ea", books per-item discounts
// as positive products and once read "Total Grams: 4.20" as the total. The
// indexer's Dutchie extractor reads the labelled layout instead; this is how
// its row reaches the page. Gated on the engine name: rows indexed before that
// extractor existed keep their old engine and keep rendering locally.

export const DUTCHIE_ENGINE = "rdh-dutchie-escpos";

/** True when `/parsed` holds a usable row from the indexer's Dutchie extractor. */
export function isDutchieParsed(payload: ParsedReceiptPayload | null | undefined): payload is ParsedReceiptPayload & { receipt: ParsedReceipt } {
  return payload?.parseStatus === "ok" && payload.receipt?.extractorEngine === DUTCHIE_ENGINE && hasUsableReceipt(payload);
}

function dutchieToSummary(receipt: ParsedReceipt): ReceiptSummary {
  // Item `price` is the printed GROSS line amount and `discount` is negative
  // per line. The row's `subtotal` is NET (total - tax - fees), so showing
  // the discount means adding it back:
  //   Subtotal + Tax + Fees - Discount == Total
  // and Subtotal is then the printed figure. The discount is the printed
  // Total Discount when the row has it (item AND cart-level discounts); an
  // older row only has the per-item lines, which miss a cart discount.
  const itemDiscounts = -receipt.lineItems.reduce((s, li) => s + (li.discount ?? 0), 0);
  const discountAmount = receipt.discountTotal ?? itemDiscounts;
  const discount = discountAmount > 0.004 ? round2(discountAmount) : undefined;
  return {
    merchantName: receipt.merchantName ?? undefined,
    addressLines: receipt.merchantAddress ? [receipt.merchantAddress] : [],
    dateline: receipt.date ?? undefined,
    items: receipt.lineItems.map((li) => ({ label: li.name, name: li.name, qty: li.quantity, amount: li.price })),
    subtotal: receipt.subtotal != null ? round2(receipt.subtotal + (discount ?? 0)) : undefined,
    tax: receipt.tax ?? undefined,
    tip: undefined,
    discount,
    total: receipt.total ?? undefined,
    paymentLine: paymentLineOf(receipt),
    bodyLines: receipt.rawText ? textToBodyLines(redactCustomerIds(receipt.rawText)) : [],
    // Each tax line as printed ("CA Sales 8.625%", "CA Excise 15%"). Dutchie
    // prices are tax-inclusive, so a rate derived from tax / subtotal is
    // wrong; never show one, even when the components are missing.
    taxLines: receipt.taxComponents.length > 0 ? receipt.taxComponents : undefined,
    deriveTaxRate: false,
    fees: receipt.fees.length > 0 ? receipt.fees : undefined,
  };
}

/**
 * Mirror of the indexer's redactCustomerIds (Papex_RDH_Backend
 * lambdas/indexer/lib/dutchieReceipt.js), same patterns and replacement.
 * The indexer already redacts rawText before storing it; this is defence in
 * depth, so a row written by any other path never shows `Customer:: <id>` or
 * `Patient: <id>` on a public page. Line-anchored: "Due Customer: $10.00" is
 * the change line and is never touched. Idempotent.
 */
const CUSTOMER_ID_RE = /^(\s*(?:Customer|Patient)(?:\s+(?:Name|ID|Id|No\.?|Number|#))?\s*:{1,2})[^\r\n]*/gm;
const OTHER_ID_RE = /^(\s*(?:MMJ|Medical|Med|State|Rec|Loyalty|Member)\s*(?:ID|Id|#|Card|Number|No\.?)\s*:{1,2})[^\r\n]*/gm;
/**
 * Client-only, broader than the indexer: contact details and the loyalty
 * block's identifying lines. `Customer Phone:`, `Loyalty Phone:`,
 * `Member: Jane Doe`, `Member Name:`, `Rewards Email:`, `Email:`, `Name:`.
 * Never `Loyalty Points ...` (the points are shown on purpose) and never
 * `Due Customer:` (not at line start).
 */
const CONTACT_RE =
  /^(\s*(?:(?:Customer|Patient|Member|Loyalty|Rewards?)\s+(?:Phone|Mobile|Cell|E-?mail|Name)|Member|E-?mail(?:\s+Address)?|Phone\s+Number|Name)\s*:{1,2})[^\r\n]*/gim;

export function redactCustomerIds(raw: string): string {
  return raw
    .replace(CUSTOMER_ID_RE, "$1 [redacted]")
    .replace(OTHER_ID_RE, "$1 [redacted]")
    .replace(CONTACT_RE, "$1 [redacted]");
}

/**
 * Anchors that identify a Dutchie print: the indexer's DUTCHIE_ANCHORS (4 of
 * 5 must match, on trimmed lines). Used to redact rows the Dutchie extractor
 * never saw (indexed by the generic parser before it existed, or no /parsed
 * answer at all), which the page renders from the local parse.
 */
const DUTCHIE_ANCHORS = [
  /^Order:\s*\S+/,
  /^Cashier:\s*\S/,
  /^Total Discount:\s*-?\$/,
  /^Due Customer:\s*-?\$/,
  /^Total Items:\s*\d/,
];

export function looksLikeDutchie(lines: readonly string[]): boolean {
  const texts = lines.map((t) => t.trim());
  return DUTCHIE_ANCHORS.filter((re) => texts.some((t) => re.test(t))).length >= 4;
}

/**
 * A locally parsed summary with customer/patient ids redacted, when the
 * receipt looks like Dutchie. Any other receipt comes back as the SAME
 * object, untouched.
 */
export function redactDutchieSummary(summary: ReceiptSummary): ReceiptSummary {
  if (!looksLikeDutchie(summary.bodyLines.map((l) => l.text))) return summary;
  return {
    ...summary,
    addressLines: summary.addressLines.map(redactCustomerIds),
    // An "item" the local parser made out of an id or contact line goes
    // entirely, amount included (a phone number can parse as a price).
    items: summary.items.filter((i) => redactCustomerIds(i.label) === i.label && redactCustomerIds(i.name) === i.name),
    bodyLines: summary.bodyLines.map((l) => ({ ...l, text: redactCustomerIds(l.text) })),
  };
}

function textToBodyLines(text: string): ReceiptLine[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  while (lines.length > 0 && lines[0].trim() === "") lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
  // Dutchie prints the whole receipt in Font B (`ESC ! 1`), no alignment.
  return lines.map((t) => ({ text: t, align: "left", style: { ...defaultStyle(), fontB: true } }));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
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
