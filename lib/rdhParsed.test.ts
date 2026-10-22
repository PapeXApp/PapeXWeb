// lib/rdhParsed.test.ts
//
// Standalone test script for the parsed-receipt contract (no test framework in
// this repo — see package.json). Run with:
//   npm run test:parsed   (uses `tsx`, same pattern as test:state)
//
// PAYLOAD is the VERBATIM body of `GET /receipt/{sid}/parsed` for a real Blaze
// receipt after the indexer's OCR pass landed — the same extraction that came
// back from prod (gemma-4, 2026-08-18) for the decoded bitmap. Keeping the real
// field names, the real nulls and the real numbers is the point: this is the
// contract between two repositories, and a drift on either side should fail
// here rather than on a customer's phone.
//
// The load-bearing assertions are the ones about NOT upgrading. Replacing a
// legible photograph of a receipt with three empty cards is strictly worse
// than leaving the photograph alone, so every "is this worth showing" gate has
// to fail closed.

import assert from "node:assert/strict";
import {
  hasUsableReceipt,
  isDutchieParsed,
  looksLikeDutchie,
  normalizePayload,
  parsedToSummary,
  redactCustomerIds,
  redactDutchieSummary,
  shouldKeepPolling,
  type ParsedReceiptPayload,
} from "./rdhParsed";
import { hasStructure, summarizeReceipt } from "./receiptSummary";
import { defaultStyle } from "./escpos";
import { DUTCHIE_PARSED_BUNDLE, DUTCHIE_PARSED_FEE } from "./__fixtures__/dutchieParsed";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL - ${name}`);
    console.error(err instanceof Error ? err.message : err);
  }
}

const PAYLOAD = {
  sid: "3ea8e69cc7764ad8",
  parseStatus: "ok",
  hasImage: true,
  uploadedAt: "2026-06-02T12:00:05.123Z",
  receipt: {
    merchantName: "Star Clothing Boutique",
    merchantAddress: "123 Star Road, City, State 12345",
    date: null,
    subtotal: 156.95,
    tax: 0,
    total: 156.95,
    lineItems: [
      { name: "PLAIN T-SHIRT", quantity: 1, price: 10.99, sku: "300678566" },
      { name: "BLACK DENIM", quantity: 1, price: 29.99, sku: "300692003" },
      { name: "BLUE DENIM", quantity: 1, price: 29.99, sku: "300651148" },
      { name: "STRIPED DRESS", quantity: 1, price: 49.99, sku: "300642980" },
      { name: "BLACK BOOTS", quantity: 1, price: 35.99, sku: "30063847" },
    ],
    paymentMethod: null,
    cardBrand: null,
    cardLast4: null,
    receiptNumber: null,
    confidence: "medium",
    extractorEngine: "gemma-4",
  },
};

/** The far more common shape: OCR hasn't landed yet. */
const RASTER_PENDING = {
  sid: "3ea8e69cc7764ad8",
  parseStatus: "ok_raster",
  hasImage: true,
  uploadedAt: "2026-06-02T12:00:05.123Z",
  receipt: null,
};

// ---- normalizePayload -------------------------------------------------------

test("normalizePayload accepts the real upgraded payload verbatim", () => {
  const p = normalizePayload(PAYLOAD);
  assert.ok(p);
  assert.equal(p.parseStatus, "ok");
  assert.equal(p.hasImage, true);
  assert.equal(p.receipt?.merchantName, "Star Clothing Boutique");
  assert.equal(p.receipt?.total, 156.95);
  assert.equal(p.receipt?.lineItems.length, 5);
});

test("normalizePayload accepts the pre-OCR raster payload", () => {
  const p = normalizePayload(RASTER_PENDING);
  assert.ok(p);
  assert.equal(p.parseStatus, "ok_raster");
  assert.equal(p.receipt, null);
  assert.equal(p.hasImage, true);
});

test("normalizePayload rejects anything it doesn't recognise", () => {
  for (const bad of [null, undefined, 42, "no", [], {}, { parseStatus: "weird" }]) {
    assert.equal(normalizePayload(bad), null, `should reject ${JSON.stringify(bad)}`);
  }
});

test("normalizePayload never coerces junk into a receipt", () => {
  const p = normalizePayload({
    parseStatus: "ok",
    hasImage: "yes",              // not `true` -> false, not truthy-coerced
    receipt: { merchantName: "   ", total: "not a number", lineItems: "nope" },
  });
  assert.ok(p);
  assert.equal(p.hasImage, false);
  assert.equal(p.receipt?.merchantName, null);
  assert.equal(p.receipt?.total, null);
  assert.deepEqual(p.receipt?.lineItems, []);
});

// ---- hasUsableReceipt: the "is this worth showing" gate ----------------------

test("hasUsableReceipt is true for the real extraction", () => {
  assert.equal(hasUsableReceipt(normalizePayload(PAYLOAD)), true);
});

test("hasUsableReceipt is FALSE for an empty extraction — the picture wins", () => {
  const empty = normalizePayload({
    parseStatus: "ok",
    hasImage: true,
    receipt: { merchantName: null, total: null, lineItems: [] },
  });
  assert.equal(hasUsableReceipt(empty), false);
  assert.equal(hasUsableReceipt(normalizePayload(RASTER_PENDING)), false);
  assert.equal(hasUsableReceipt(null), false);
});

// ---- shouldKeepPolling: the loop must be able to stop ------------------------

test("polling continues while the receipt is pending or still a bare raster", () => {
  assert.equal(shouldKeepPolling(normalizePayload(RASTER_PENDING)), true);
  assert.equal(
    shouldKeepPolling(normalizePayload({ parseStatus: "pending", hasImage: false, receipt: null })),
    true,
  );
  // Nothing known yet (the server-side fetch errored) — worth one look.
  assert.equal(shouldKeepPolling(null), true);
});

test("polling STOPS on success and on a terminal failure", () => {
  assert.equal(shouldKeepPolling(normalizePayload(PAYLOAD)), false);
  assert.equal(
    shouldKeepPolling(normalizePayload({ parseStatus: "failed", hasImage: true, receipt: null })),
    false,
    "the indexer looked and could not read it — waiting changes nothing",
  );
});

test("an 'ok' status with an unusable body does not stop the loop prematurely", () => {
  // Defensive: `ok` with nothing in it shouldn't happen (the backend gates on
  // the same structural test), but if it ever does, the poller keeps looking
  // rather than declaring victory over an empty card stack.
  const p = normalizePayload({ parseStatus: "ok_raster", hasImage: true, receipt: {} });
  assert.equal(hasUsableReceipt(p), false);
  assert.equal(shouldKeepPolling(p), true);
});

// ---- parsedToSummary: one renderer for both receipt kinds --------------------

test("parsedToSummary produces a summary the designed cards accept", () => {
  const payload = normalizePayload(PAYLOAD) as ParsedReceiptPayload;
  const summary = parsedToSummary(payload.receipt!);

  assert.equal(hasStructure(summary), true);
  assert.equal(summary.merchantName, "Star Clothing Boutique");
  assert.deepEqual(summary.addressLines, ["123 Star Road, City, State 12345"]);
  assert.equal(summary.total, 156.95);
  assert.equal(summary.subtotal, 156.95);
  assert.equal(summary.tax, 0);
  assert.equal(summary.items.length, 5);
  assert.deepEqual(summary.items[0], {
    label: "PLAIN T-SHIRT",
    name: "PLAIN T-SHIRT",
    qty: 1,
    amount: 10.99,
  });
  // Items must still add up to the printed total after the mapping, or the
  // Totals card's subtotal fallback would quietly disagree with the receipt.
  assert.equal(
    summary.items.reduce((s, i) => s + i.amount * i.qty, 0).toFixed(2),
    "156.95",
  );
});

test("parsedToSummary leaves bodyLines empty so no blank monospace box renders", () => {
  const payload = normalizePayload(PAYLOAD) as ParsedReceiptPayload;
  // The "original" for a Blaze receipt is the bitmap, which gets its own
  // collapsible in app/r/ui.tsx. An empty text body here is what stops a
  // second, permanently-empty one appearing beside it.
  assert.deepEqual(parsedToSummary(payload.receipt!).bodyLines, []);
});

test("parsedToSummary rebuilds a payment line the chip renderer can read", () => {
  const p = normalizePayload({
    parseStatus: "ok",
    hasImage: true,
    receipt: { merchantName: "X", total: 1, lineItems: [], cardBrand: "VISA", cardLast4: "4729" },
  }) as ParsedReceiptPayload;
  assert.equal(parsedToSummary(p.receipt!).paymentLine, "VISA ****4729");

  // Nothing to say -> no payment row at all, rather than an empty one.
  const bare = normalizePayload({
    parseStatus: "ok",
    hasImage: true,
    receipt: { merchantName: "X", total: 1, lineItems: [] },
  }) as ParsedReceiptPayload;
  assert.equal(parsedToSummary(bare.receipt!).paymentLine, undefined);
});

test("a receipt with only a total still structures (no fabricated merchant)", () => {
  const p = normalizePayload({
    parseStatus: "ok",
    hasImage: true,
    receipt: { total: 4.5, lineItems: [] },
  }) as ParsedReceiptPayload;
  const summary = parsedToSummary(p.receipt!);
  assert.equal(hasStructure(summary), true);
  assert.equal(summary.merchantName, undefined, "never invents a merchant name");
  assert.deepEqual(summary.addressLines, []);
});

// ---- Dutchie: the indexer's row replaces the local text parse ----------------

const dutchie = (raw: unknown) => normalizePayload(raw) as ParsedReceiptPayload;
const bodyText = (raw: unknown) =>
  parsedToSummary(dutchie(raw).receipt!).bodyLines.map((l) => l.text).join("\n");

test("isDutchieParsed: only an ok row written by the Dutchie extractor", () => {
  assert.equal(isDutchieParsed(dutchie(DUTCHIE_PARSED_BUNDLE)), true);
  // Old rows keep the generic parser's engine and must keep rendering locally.
  const old = structuredClone(DUTCHIE_PARSED_BUNDLE);
  old.receipt.extractorEngine = "rdh-escpos";
  assert.equal(isDutchieParsed(dutchie(old)), false);
  const noEngine = structuredClone(DUTCHIE_PARSED_BUNDLE) as Record<string, unknown>;
  delete (noEngine.receipt as Record<string, unknown>).extractorEngine;
  assert.equal(isDutchieParsed(dutchie(noEngine)), false);
  assert.equal(isDutchieParsed(dutchie({ ...DUTCHIE_PARSED_BUNDLE, parseStatus: "failed" })), false);
  assert.equal(isDutchieParsed(dutchie({ ...DUTCHIE_PARSED_BUNDLE, parseStatus: "pending", receipt: null })), false);
  assert.equal(isDutchieParsed(null), false);
  // Blaze/OCR rows (the existing fixture) are not Dutchie.
  assert.equal(isDutchieParsed(normalizePayload(PAYLOAD)), false);
});

test("Dutchie: items, per-item discounts and totals match the paper", () => {
  const p = dutchie(DUTCHIE_PARSED_BUNDLE);
  assert.deepEqual(p.receipt!.lineItems.map((li) => li.discount), [-2, -2, null]);
  const s = parsedToSummary(p.receipt!);
  assert.equal(s.merchantName, "Union Cannabis Club");
  assert.deepEqual(s.items.map((i) => [i.name, i.qty, i.amount]), [
    ["SUNSET CONNECT - 1G - HYBRID - FULTON 5ER", 2, 12],
    ["SUNSET CONNECT - 1G - SATIVA - FULTON 5ER", 2, 12],
    ["ST IDES - TEA - HIGH PUNCH", 2, 20],
  ]);
  // Paper: Subtotal $36.02, Total Tax $7.98, Total Discount $4.00, Total $40.00.
  assert.equal(s.subtotal, 36.02);
  assert.equal(s.tax, 7.98);
  assert.equal(s.discount, 4);
  assert.equal(s.total, 40);
  assert.equal((s.subtotal! + s.tax! - s.discount!).toFixed(2), "40.00");
  assert.equal(s.paymentLine, "Cash");
  assert.equal(hasStructure(s), true);
});

test("Dutchie: a receipt with a fee still shows the printed subtotal", () => {
  const s = parsedToSummary(dutchie(DUTCHIE_PARSED_FEE).receipt!);
  // Paper: $10.00 item, -$2.50, Subtotal $8.50, Tax $1.50, fee $0.26, Total $7.76.
  assert.equal(s.subtotal, 8.5);
  assert.equal(s.discount, 2.5);
  assert.equal(s.total, 7.76);
  assert.equal(s.paymentLine, "Dutchie Pay");
});

test("Dutchie: no discounts -> no Discount row and the subtotal is untouched", () => {
  const raw = structuredClone(DUTCHIE_PARSED_BUNDLE);
  raw.receipt.lineItems = raw.receipt.lineItems.map((li) => ({ ...li, discount: null }));
  const s = parsedToSummary(dutchie(raw).receipt!);
  assert.equal(s.discount, undefined);
  assert.equal(s.subtotal, 32.02);
});

test("Dutchie: the original receipt is the indexer's text, customer id redacted", () => {
  const text = bodyText(DUTCHIE_PARSED_BUNDLE);
  assert.match(text, /^Union Cannabis Club\n2030 Union Street/, "leading blank lines trimmed");
  assert.match(text, /^Customer:: \[redacted\]$/m);
  assert.match(text, /^Due Customer: \$10\.00$/m, "the change line is not an id");
  assert.match(text, /^Total: \$40\.00$/m);
  const lines = parsedToSummary(dutchie(DUTCHIE_PARSED_BUNDLE).receipt!).bodyLines;
  assert.ok(lines.every((l) => l.align === "left" && l.style.fontB), "rendered as printed: Font B");
});

test("Dutchie: an unredacted id in rawText is redacted client-side too", () => {
  const raw = structuredClone(DUTCHIE_PARSED_BUNDLE);
  raw.receipt.rawText = raw.receipt.rawText
    .replace("Customer:: [redacted]", "Customer:: 12345678\nPatient: 7654321\nMMJ ID: CA-0001");
  const text = bodyText(raw);
  assert.doesNotMatch(text, /12345678|7654321|CA-0001/);
  assert.match(text, /^Customer:: \[redacted\]$/m);
  assert.match(text, /^Patient: \[redacted\]$/m);
  assert.match(text, /^MMJ ID: \[redacted\]$/m);
  assert.match(text, /^Due Customer: \$10\.00$/m);
});

test("redactCustomerIds is idempotent and leaves other lines alone", () => {
  const once = redactCustomerIds("Order: 1\nCustomer:: 42\nDue Customer: $0");
  assert.equal(once, "Order: 1\nCustomer:: [redacted]\nDue Customer: $0");
  assert.equal(redactCustomerIds(once), once);
});

test("Dutchie: no rawText -> no Original receipt box", () => {
  const raw = structuredClone(DUTCHIE_PARSED_BUNDLE) as Record<string, unknown>;
  (raw.receipt as Record<string, unknown>).rawText = null;
  assert.deepEqual(parsedToSummary(dutchie(raw).receipt!).bodyLines, []);
});

test("non-Dutchie rows are unchanged: no Discount, no text body", () => {
  const withDiscount = structuredClone(PAYLOAD) as { receipt: { lineItems: Record<string, unknown>[]; rawText?: string } };
  withDiscount.receipt.lineItems[0].discount = -1;
  withDiscount.receipt.rawText = "STAR CLOTHING\nCustomer:: 1";
  const s = parsedToSummary((normalizePayload(withDiscount) as ParsedReceiptPayload).receipt!);
  assert.equal(s.discount, undefined);
  assert.equal(s.subtotal, 156.95);
  assert.deepEqual(s.bodyLines, []);
});

// ---- Local-parse redaction for anything that looks like Dutchie -------------

const asLines = (text: string) =>
  text.split("\n").map((t) => ({ text: t, align: "left" as const, style: defaultStyle() }));

test("redactDutchieSummary: a Dutchie-looking local parse loses its ids", () => {
  const raw = DUTCHIE_PARSED_BUNDLE.receipt.rawText.replace("Customer:: [redacted]", "Customer:: 12345678\nPatient: 7654321");
  assert.equal(looksLikeDutchie(raw.split("\n")), true);
  const s = redactDutchieSummary(summarizeReceipt(asLines(raw)));
  const all = JSON.stringify(s);
  assert.doesNotMatch(all, /12345678|7654321/);
  assert.ok(s.bodyLines.some((l) => l.text === "Customer:: [redacted]"));
  assert.ok(s.bodyLines.some((l) => l.text === "Patient: [redacted]"));
  assert.ok(s.bodyLines.some((l) => l.text === "Due Customer: $10.00"));
});

test("redactDutchieSummary: a non-Dutchie receipt is returned untouched", () => {
  // Has a Customer line and two of the five anchors: not enough.
  const raw = "CORNER CAFE\nOrder: 77\nCustomer: Jane Doe\nLatte  4.50\nTotal Items: 1\nTOTAL  4.50";
  assert.equal(looksLikeDutchie(raw.split("\n")), false);
  const summary = summarizeReceipt(asLines(raw));
  assert.equal(redactDutchieSummary(summary), summary, "same object, nothing rewritten");
});

// ---- Summary ----------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
