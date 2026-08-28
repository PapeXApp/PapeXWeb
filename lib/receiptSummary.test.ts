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
  type PaymentNetwork,
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
  // Only the date/time substring, reformatted — not the entire raw line
  // (Swift parity: the order number belongs elsewhere, not in the dateline).
  assert.equal(summary.dateline, "Jun 8, 2026 • 10:24 AM");
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
  // The cash rule used to be receiptDetail.tsx's verbatim
  // `lower === "cash" || lower.includes(" cash ")`, which needed the line to
  // be exactly "CASH" or to have cash flanked by spaces — so "Paid with cash"
  // (no trailing space) and "CASH APPROVED" both returned null. It is now a
  // \bcash\b word-boundary match, so trailing-position cash is recognised.
  assert.equal(detectPaymentMethod("CASH"), "cash");
  assert.equal(detectPaymentMethod("Paid with cash"), "cash");
  assert.equal(detectPaymentMethod("EBT"), "ebt");
  assert.equal(detectPaymentMethod(null), null);
  assert.equal(detectPaymentMethod("Store credit"), null);
});

// ---- Cash / Cash App / debit classification ----------------------------------
//
// Three defects found against a cash-heavy merchant (a dispensary is ~60-65%
// cash and ~28% debit, so ~88% of its rows rendered blank or wrong):
//   1. a bare "CASH" line was never extracted INDEX-side in Papex_RDH, so it
//      never reached this chip at all;
//   2. "CASH APPROVED" classified as cash_app, because "cash app" is a
//      literal substring of "cash approved" and cash_app is checked first;
//   3. "DEBIT ****2012 APPROVED" matched no rule, so PaymentChip rendered "—".
//
// A fourth followed once the RDH dispensary demo went in: ACH / bank-pay apps
// (Aeropay, Dutchie Pay, Stronghold) are a real dispensary tender and hit the
// same em dash, so `bank_pay` was added — word-boundary matched, because "ach"
// is a substring of "each"/"spinach"/"attach" and "Dutchie" alone is the POS
// platform printed in receipt footers, not a tender.
//
// This table is the lockstep guard for this copy of the rules. The equivalent
// tables live in Papex_RDH/lambdas/indexer/tests/payment-detection.test.js,
// Papex_RDH/lambdas/merchant-api/tests/handler.test.js and
// papex-adapter-backend/tests/unit/rdh-summarize.test.mjs — all four agree.
const PAYMENT_CLASSIFICATION: Array<[string, PaymentNetwork | null]> = [
  // cash, in the forms real printers emit
  ["CASH", "cash"],
  ["CASH APPROVED", "cash"],
  ["PAID CASH APPROVED", "cash"],
  ["TENDER: CASH APPROVED", "cash"],
  ["CASH PAYMENT APPROVED", "cash"],
  ["CASH TENDER APPROVED", "cash"],
  ["CASH             50.00", "cash"],
  ["Cash", "cash"],
  // Cash App must not regress into the cash rule
  ["CASH APP", "cash_app"],
  ["CashApp", "cash_app"],
  ["Cash App ****1234 APPROVED", "cash_app"],
  ["CASH APP PAY ****9911", "cash_app"],
  // unbranded PIN debit ("cashless ATM")
  ["DEBIT ****2012 APPROVED", "debit"],
  ["DEBIT", "debit"],
  ["US DEBIT ****4417", "debit"],
  // a branded debit card keeps its network, not "debit"
  ["VISA DEBIT ****1234 APPROVED", "visa"],
  ["MASTERCARD DEBIT ****5555", "mastercard"],
  // ACH / bank-pay apps
  ["AEROPAY ****1234 APPROVED", "bank_pay"],
  ["AEROPAY", "bank_pay"],
  ["Aeropay", "bank_pay"],
  ["AEROPAY            42.47", "bank_pay"],
  ["DUTCHIE PAY ****5678 APPROVED", "bank_pay"],
  ["DUTCHIEPAY", "bank_pay"],
  ["Dutchie Pay", "bank_pay"],
  ["STRONGHOLD ****9012 APPROVED", "bank_pay"],
  ["CANPAY ****3344", "bank_pay"],
  ["HYPUR", "bank_pay"],
  ["ACH", "bank_pay"],
  ["ACH TRANSFER       42.47", "bank_pay"],
  // a named bank-pay brand outranks the generic debit fallback
  ["CANPAY DEBIT ****1234", "bank_pay"],
  ["ACH DEBIT ****7788", "bank_pay"],
  // existing card brands, unaffected
  ["VISA ****1234 APPROVED", "visa"],
  ["MASTERCARD ENDING IN 4444", "mastercard"],
  ["MASTER CARD ****4444", "mastercard"],
  ["AMEX ****0005", "amex"],
  ["AMERICAN EXPRESS ****0005", "amex"],
  ["DISCOVER CARD", "discover"],
  ["DINERS CLUB ****3600", "diners_club"],
  ["JCB ****3566", "jcb"],
  ["UNIONPAY ****6250", "unionpay"],
  ["MAESTRO ****6759", "maestro"],
  // existing wallets/tenders, unaffected
  ["Apple Pay", "apple_pay"],
  ["GOOGLE PAY", "google_pay"],
  ["GPAY", "google_pay"],
  ["PayPal", "paypal"],
  ["VENMO", "venmo"],
  ["EBT ****1122", "ebt"],
  ["FOOD STAMP", "ebt"],
  ["CHECK #1042", "check"],
  ["CHEQUE #1042", "check"],
  // not payment tenders
  ["CASHIER: Jane", null],
  ["CASH BACK          20.00", null],
  ["Store credit", null],
  ["some random line", null],
  ["", null],
  // the substring traps the bank-pay rule must not fall into: "ach" is a
  // substring of ordinary receipt text, and "Dutchie" alone is the POS /
  // e-commerce platform printed in dispensary footers, not a tender
  ["Powered by Dutchie", null],
  ["SPINACH WRAP         8.00", null],
  ["EACH ADDITIONAL ITEM 2.00", null],
  ["Please attach your receipt", null],
  ["MACHINE #4", null],
];

for (const [paymentLine, expected] of PAYMENT_CLASSIFICATION) {
  test(`detectPaymentMethod(${JSON.stringify(paymentLine)}) -> ${expected}`, () => {
    assert.equal(detectPaymentMethod(paymentLine), expected);
  });
}

test("every PaymentNetwork the detector can return has a chip style", () => {
  // PAYMENT_METHOD_STYLES is a Record<PaymentNetwork, ...>, so this is
  // compile-time enforced — but PaymentChip looks the style up with a value
  // that arrives as free JSON from the merchant API, so assert it at runtime
  // too. A network added to the union without a style renders as a crash.
  for (const [, expected] of PAYMENT_CLASSIFICATION) {
    if (expected === null) continue;
    const style = PAYMENT_METHOD_STYLES[expected];
    assert.ok(style, `no chip style for network "${expected}"`);
    assert.ok(style.label.length > 0, `empty chip label for network "${expected}"`);
  }
});

test("debit renders its own chip, distinct from the card networks", () => {
  assert.deepEqual(PAYMENT_METHOD_STYLES.debit, {
    bg: "#475569",
    label: "DEBIT",
    textColor: "#FFFFFF",
  });
});

test("bank_pay renders its own chip, distinct from the card networks and cash", () => {
  assert.deepEqual(PAYMENT_METHOD_STYLES.bank_pay, {
    bg: "#0F766E",
    label: "BANK PAY",
    textColor: "#FFFFFF",
  });
});

test("no two payment networks share a chip colour", () => {
  // The chip is the only thing distinguishing tenders in the transactions
  // table, so two networks rendering the same swatch is a silent readability
  // bug — and bank_pay is the fourth no-card-network tender competing for the
  // neutral end of the palette alongside cash, debit and check.
  const seen = new Map<string, string>();
  for (const [network, style] of Object.entries(PAYMENT_METHOD_STYLES)) {
    const clash = seen.get(style.bg);
    assert.ok(!clash, `${network} and ${clash} both render ${style.bg}`);
    seen.set(style.bg, network);
  }
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

// Regression tests for the silent-truncation bug: TRAILING_MONEY_RE used to
// require a comma every 3 digits (`,\d{3}` mandatory), so an ESC/POS total
// printed WITHOUT thousands separators only matched its last 1-3 integer
// digits before the decimal point. Verified end-to-end on real hardware
// (device -> upload -> indexer -> DynamoDB): "TOTAL 1234.56" indexed as
// 234.56 ($1000 silently lost); an 80-item receipt's 5886.47 indexed as
// 886.47; a 700-item receipt's 53604.32 indexed as 604.32. parse_status
// stayed "ok" and confidence "medium" throughout — no signal anything was
// wrong.
test("trailingAmount captures amounts without thousands separators (the reported bug)", () => {
  assert.equal(trailingAmount("TOTAL             1234.56"), 1234.56);
  assert.equal(trailingAmount("TOTAL             1,234.56"), 1234.56); // no regression
  assert.equal(trailingAmount("TOTAL             999.99"), 999.99); // no regression (3-digit boundary)
  assert.equal(trailingAmount("TOTAL             53604.32"), 53604.32); // real observed value, 80-item receipt
  assert.equal(trailingAmount("TOTAL             12,345,678.90"), 12345678.9);
  assert.equal(trailingAmount("TOTAL             0.99"), 0.99);
});

test("trailingAmount does not swallow a non-money digit run with no 2-decimal tail (negative case)", () => {
  // No decimal point at all — must not match despite the widened integer part.
  assert.equal(trailingAmount("TOTAL ITEMS SOLD 42"), undefined);
  // A phone number / long digit run adjacent to real money must not bridge
  // into the actual amount — anchoring at $ with a required \.\d{2} tail
  // (unchanged by this fix) is what prevents that.
  assert.equal(trailingAmount("(415) 555-0142"), undefined);
});

test("summarizeReceipt captures a >$999 total and line item with no thousands separator", () => {
  const lines = [
    line("Bluebird Coffee"),
    line("Espresso Machine  1499.00"),
    line("TOTAL             1499.00"),
  ];
  const summary = summarizeReceipt(lines);
  assert.equal(summary.total, 1499.0);
  assert.equal(summary.items.length, 1);
  assert.equal(summary.items[0].name, "Espresso Machine");
  assert.equal(summary.items[0].amount, 1499.0);
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

test("dateline with leading text yields only the reformatted date/time substring", () => {
  const lines = [
    line("Corner Deli", "center"),
    line(""),
    line("Order #1042 Jun 8, 2026 10:24 AM"),
    line("Sandwich              6.00"),
    line("TOTAL                 6.00"),
  ];
  const summary = summarizeReceipt(lines);
  assert.equal(summary.dateline, "Jun 8, 2026 • 10:24 AM");
});

test("a date line with surrounding text in the header block is still index-deduped", () => {
  // String-equality dedupe broke once the dateline became a reformatted
  // substring; the Swift-parity index-based dedupe must still exclude the
  // consumed line from addressLines.
  const lines = [
    line("Corner Deli", "center"),
    line("Printed Jun 8, 2026 10:24 AM", "center"),
    line("1  Sandwich   6.00"),
  ];
  const summary = summarizeReceipt(lines);
  assert.equal(summary.dateline, "Jun 8, 2026 • 10:24 AM");
  assert.deepEqual(summary.addressLines, []);
});

test("item label without a qty prefix keeps the whole label as the name", () => {
  const lines = [line("Shop"), line(""), line("Gift Card              25.00")];
  const summary = summarizeReceipt(lines);
  assert.equal(summary.items.length, 1);
  assert.equal(summary.items[0].qty, 1);
  assert.equal(summary.items[0].name, "Gift Card");
});

// ---- Leading quantity forms --------------------------------------------------
// Every form real ESC/POS printers emit. splitQtyAndName used to match
// /^(\d+)\s+(.+)$/, which stranded the multiplier on the label for "2 x Latte"
// (name became "x Latte") and did not strip a tight "2x Latte" at all. The
// regex is now shared verbatim with papex-adapter-backend/src/rdh/summarize.js
// and Papex_AppClip/Sources/AppClip/ReceiptSummary.swift.
const QTY_FORMS: Array<[string, string, number, string]> = [
  ["N Label   (space separated)", "2 Latte                9.00", 2, "Latte"],
  ["N  Label  (column padded)", "2  Bagel               9.00", 2, "Bagel"],
  ["NxLabel   (tight lowercase)", "2x Latte               9.00", 2, "Latte"],
  ["NXLabel   (tight uppercase)", "2X Latte               9.00", 2, "Latte"],
  ["N x Label (spaced lowercase)", "2 x Cappuccino         9.00", 2, "Cappuccino"],
  ["N X Label (spaced uppercase)", "2 X Cappuccino         9.00", 2, "Cappuccino"],
  ["multi-word label after N x", "1 x Cold Brew 12oz     6.50", 1, "Cold Brew 12oz"],
];

for (const [form, itemLine, qty, name] of QTY_FORMS) {
  test(`leading quantity in the "${form}" form is stripped from the name`, () => {
    const lines = [line("Shop"), line(""), line(itemLine)];
    const summary = summarizeReceipt(lines);
    assert.equal(summary.items.length, 1);
    assert.equal(summary.items[0].qty, qty);
    assert.equal(summary.items[0].name, name);
  });
}

// Requiring whitespace after the optional [xX] keeps the regex from swallowing
// the first word of a label that merely begins with an x, or treating a unit
// token as a multiplier.
const QTY_NON_GREEDY: Array<[string, string, number, string]> = [
  ["label beginning with X", "3 Xylophone            9.00", 3, "Xylophone"],
  ["unit token, not an 'x'", "12 oz Coffee           9.00", 12, "oz Coffee"],
];

for (const [caseName, itemLine, qty, name] of QTY_NON_GREEDY) {
  test(`leading quantity does not over-consume the label: ${caseName}`, () => {
    const lines = [line("Shop"), line(""), line(itemLine)];
    const summary = summarizeReceipt(lines);
    assert.equal(summary.items.length, 1);
    assert.equal(summary.items[0].qty, qty);
    assert.equal(summary.items[0].name, name);
  });
}

test("a 4+ digit leading run is left alone (PLU/SKU code, not a quantity)", () => {
  // Parity with the adapter/Swift {1,3} bound — this label used to be split
  // into qty 4066 by the unbounded \d+ here.
  const lines = [line("Shop"), line(""), line("4066 Sparkling Water    2.75")];
  const summary = summarizeReceipt(lines);
  assert.equal(summary.items.length, 1);
  assert.equal(summary.items[0].qty, 1);
  assert.equal(summary.items[0].name, "4066 Sparkling Water");
});

// ---- Summary -----------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
