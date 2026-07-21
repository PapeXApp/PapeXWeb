// lib/receiptSummary.test.ts
//
// Standalone test script for the receipt-structuring heuristics (no test
// framework in this repo — see package.json). Run with:
//   npm run test:summary   (uses `tsx`, same pattern as test:escpos)
//
// Cases are chosen to mirror what Papex_AppClip/Tests/ has for
// ReceiptSummaryTests.swift (the source this file was ported from) plus
// direct regex/table checks for the payment-chip port from
// PapeXV2/app/receiptDetail.tsx.

import assert from "node:assert/strict";
import { defaultStyle, type ReceiptLine, type Style } from "./escpos";
import { sampleReceiptLines } from "./sampleReceipt";
import {
  summarizeReceipt,
  hasStructure,
  trailingAmount,
  leadingLabel,
  detectPaymentMethod,
  extractLastFour,
  PAYMENT_METHOD_STYLES,
} from "./receiptSummary";

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

function line(text: string, align: ReceiptLine["align"] = "left", style: Style = defaultStyle()): ReceiptLine {
  return { text, align, style };
}

// ---- Sample receipt end-to-end ---------------------------------------------

test("sample receipt: merchant, address, date all extracted", () => {
  const summary = summarizeReceipt(sampleReceiptLines);
  assert.equal(summary.merchantName, "BLUEBIRD COFFEE");
  assert.deepEqual(summary.addressLines, ["412 Walnut St", "Syracuse, NY 13202", "(315) 555-0142"]);
  assert.equal(summary.dateline, "Order #1042   Jun 8, 2026  10:24 AM");
  assert.equal(hasStructure(summary), true);
});

test("sample receipt: exactly the 4 purchasable items, totals excluded", () => {
  const summary = summarizeReceipt(sampleReceiptLines);
  assert.equal(summary.items.length, 4);
  assert.deepEqual(
    summary.items.map((i) => i.name),
    ["Cortado", "Oat milk add-on", "Almond croissant", "Sparkling water"]
  );
  assert.deepEqual(
    summary.items.map((i) => i.qty),
    [1, 1, 1, 1]
  );
  assert.deepEqual(
    summary.items.map((i) => i.amount),
    [4.25, 0.75, 4.5, 2.0]
  );
});

test("sample receipt: subtotal/tax/total recovered from text scan", () => {
  const summary = summarizeReceipt(sampleReceiptLines);
  assert.equal(summary.subtotal, 11.5);
  assert.equal(summary.tax, 0.92);
  assert.equal(summary.total, 12.42);
  assert.equal(summary.tip, undefined);
  assert.equal(summary.discount, undefined);
});

test("sample receipt: payment line recovered and body preserved verbatim", () => {
  const summary = summarizeReceipt(sampleReceiptLines);
  assert.equal(summary.paymentLine, "VISA  ****4729   APPROVED");
  assert.equal(summary.bodyLines, sampleReceiptLines);
});

// ---- Payment-method chip port ------------------------------------------------

test("detectPaymentMethod + extractLastFour on the sample's payment line", () => {
  const network = detectPaymentMethod("VISA  ****4729   APPROVED");
  assert.equal(network, "visa");
  assert.equal(extractLastFour("VISA  ****4729   APPROVED"), "4729");
  assert.deepEqual(PAYMENT_METHOD_STYLES.visa, { bg: "#1A1F71", label: "VISA", textColor: "#FFFFFF" });
});

test("detectPaymentMethod covers every network the app chip table supports", () => {
  assert.equal(detectPaymentMethod("Mastercard ending in 1234"), "mastercard");
  assert.equal(detectPaymentMethod("AMEX ****0005"), "amex");
  assert.equal(detectPaymentMethod("Apple Pay"), "apple_pay");
  assert.equal(detectPaymentMethod("Google Pay"), "google_pay");
  // Ported verbatim from receiptDetail.tsx: matches only an exact "cash" or
  // " cash " substring (with surrounding spaces), not any string containing
  // "cash" — e.g. "Paid with cash" does NOT match, since it doesn't end in
  // a space after "cash". This mirrors the app's real (if quirky) behavior.
  assert.equal(detectPaymentMethod("CASH"), "cash");
  assert.equal(detectPaymentMethod("Paid with cash"), null);
  assert.equal(detectPaymentMethod("EBT"), "ebt");
  assert.equal(detectPaymentMethod(null), null);
  assert.equal(detectPaymentMethod("Store credit"), null);
});

test("extractLastFour handles 'ending in', asterisks, and bare trailing digits", () => {
  assert.equal(extractLastFour("Visa ending in 4242"), "4242");
  assert.equal(extractLastFour("Card ****9999"), "9999");
  assert.equal(extractLastFour("Account 1111"), "1111");
  assert.equal(extractLastFour("Cash"), null);
});

// ---- Regex helpers ------------------------------------------------------------

test("trailingAmount parses $, thousands separators, and plain decimals", () => {
  assert.equal(trailingAmount("Widget          $1,234.56"), 1234.56);
  assert.equal(trailingAmount("Latte             4.50"), 4.5);
  assert.equal(trailingAmount("no amount here"), undefined);
  assert.equal(trailingAmount("almost 4.5"), undefined); // needs 2 decimal places
});

test("leadingLabel strips the trailing amount and trims", () => {
  assert.equal(leadingLabel("Latte             4.50"), "Latte");
  assert.equal(leadingLabel("   4.50"), undefined); // nothing left after stripping
  assert.equal(leadingLabel("no amount"), undefined);
});

// ---- Structural edge cases ----------------------------------------------------

test("empty receipt has no structure", () => {
  const summary = summarizeReceipt([]);
  assert.equal(hasStructure(summary), false);
  assert.equal(summary.merchantName, undefined);
  assert.equal(summary.items.length, 0);
});

test("address extraction stops at a blank line and caps at 3 lines", () => {
  const lines = [
    line("Corner Deli", "center"),
    line("Line 1", "center"),
    line("Line 2", "center"),
    line("Line 3", "center"),
    line("Line 4 should not be included", "center"),
    line(""),
    line("1  Sandwich   6.00"),
  ];
  const summary = summarizeReceipt(lines);
  assert.equal(summary.merchantName, "Corner Deli");
  assert.deepEqual(summary.addressLines, ["Line 1", "Line 2", "Line 3"]);
});

test("address extraction stops at a divider immediately after the merchant", () => {
  const lines = [line("Corner Deli", "center"), line("--------"), line("1  Sandwich   6.00")];
  const summary = summarizeReceipt(lines);
  assert.deepEqual(summary.addressLines, []);
});

test("a short line is not mistaken for a divider (needs >= 3 dash/eq/underscore/star chars)", () => {
  const lines = [line("Shop"), line("-="), line("1  Item   1.00")];
  const summary = summarizeReceipt(lines);
  // "-=" is too short to be a divider, and it's centeredish (<=34 chars) and
  // not money/total/order-like, so it becomes an address line.
  assert.deepEqual(summary.addressLines, ["-="]);
});

test("items skip total/tax/tip/payment lines even when they end in an amount", () => {
  const lines = [
    line("Shop"),
    line(""),
    line("1  Widget                4.00"),
    line("Subtotal                 4.00"),
    line("Tax                      0.32"),
    line("Tip                      1.00"),
    line("TOTAL                    5.32"),
    line("VISA ****1111 APPROVED"),
  ];
  const summary = summarizeReceipt(lines);
  assert.equal(summary.items.length, 1);
  assert.equal(summary.items[0].name, "Widget");
  assert.equal(summary.subtotal, 4.0);
  assert.equal(summary.tax, 0.32);
  assert.equal(summary.tip, 1.0);
  assert.equal(summary.total, 5.32);
  assert.equal(summary.paymentLine, "VISA ****1111 APPROVED");
});

test("discount/rebate lines are captured separately from items and totals", () => {
  const lines = [
    line("Shop"),
    line(""),
    line("1  Widget                4.00"),
    line("Discount                -1.00".replace("-", "")), // trailingAmount doesn't model signs; keep 2-decimal form
    line("TOTAL                    3.00"),
  ];
  const summary = summarizeReceipt(lines);
  assert.equal(summary.discount, 1.0);
  assert.equal(summary.total, 3.0);
});

test("a bare date line consumed as the dateline is not duplicated in addressLines", () => {
  // Regression test for the P2 dup-date bug: a bare date line directly under
  // the merchant (no blank-line separator) used to satisfy extractAddress's
  // "short/centered, not money/total" test AND get promoted to `dateline`,
  // so it rendered twice.
  const lines = [line("Corner Deli", "center"), line("Jun 8, 2026", "center"), line("1  Sandwich   6.00")];
  const summary = summarizeReceipt(lines);
  assert.equal(summary.dateline, "Jun 8, 2026");
  assert.deepEqual(summary.addressLines, []);
});

test("a date line mixed among real address lines is excluded, siblings kept", () => {
  const lines = [
    line("Corner Deli", "center"),
    line("123 Main St", "center"),
    line("Jun 8, 2026", "center"),
    line("1  Sandwich   6.00"),
  ];
  const summary = summarizeReceipt(lines);
  assert.equal(summary.dateline, "Jun 8, 2026");
  assert.deepEqual(summary.addressLines, ["123 Main St"]);
});

test("item label without a qty prefix keeps the whole label as the name", () => {
  const lines = [line("Shop"), line(""), line("Gift Card              25.00")];
  const summary = summarizeReceipt(lines);
  assert.equal(summary.items.length, 1);
  assert.equal(summary.items[0].qty, 1);
  assert.equal(summary.items[0].name, "Gift Card");
});

// ---- Summary -----------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
