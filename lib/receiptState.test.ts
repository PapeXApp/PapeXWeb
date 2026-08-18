// lib/receiptState.test.ts
//
// Standalone test script for the /r page's four-state taxonomy (no test
// framework in this repo — see package.json). Run with:
//   npm run test:state   (uses `tsx`, same pattern as test:escpos)
//
// The load-bearing assertions here are the negative ones: NOT_AVAILABLE and
// ERROR must never resolve to the sample-showing DEMO state. That regression
// is the whole reason this module exists — a customer who tapped a real
// device and whose receipt had expired used to be shown BLUEBIRD COFFEE /
// $12.42 / "VISA •••• 4729" as if it were their purchase.

import assert from "node:assert/strict";
import { defaultStyle, type ReceiptLine } from "./escpos";
import { summarizeReceipt } from "./receiptSummary";
import { sampleReceiptLines } from "./sampleReceipt";
import { hasVisibleContent, resolveReceiptState } from "./receiptState";

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

function line(text: string): ReceiptLine {
  return { text, align: "left", style: defaultStyle() };
}

const VALID_SID = "a1b2c3d4e5f60718";

// ---- State 1: REAL ----------------------------------------------------------

test("REAL: valid sid + ok fetch + visible content", () => {
  assert.deepEqual(
    resolveReceiptState({
      rawSid: VALID_SID,
      sidIsValid: true,
      fetchStatus: "ok",
      parsedHasVisibleContent: true,
    }),
    { kind: "real" },
  );
});

// ---- State 2: NOT_AVAILABLE -------------------------------------------------

test("NOT_AVAILABLE: valid sid, backend 404", () => {
  assert.deepEqual(
    resolveReceiptState({ rawSid: VALID_SID, sidIsValid: true, fetchStatus: "not_found" }),
    { kind: "not_available", reason: "not_found" },
  );
});

test("NOT_AVAILABLE: valid sid, bytes fetched but nothing visible parsed out", () => {
  assert.deepEqual(
    resolveReceiptState({
      rawSid: VALID_SID,
      sidIsValid: true,
      fetchStatus: "ok",
      parsedHasVisibleContent: false,
    }),
    { kind: "not_available", reason: "empty" },
  );
});

test("NOT_AVAILABLE: a malformed sid never falls through to the sample", () => {
  for (const bad of ["abc", "A1B2C3D4E5F60718", "a1b2c3d4e5f6071", "a1b2c3d4e5f607189", "zzzz"]) {
    const state = resolveReceiptState({ rawSid: bad, sidIsValid: false });
    assert.equal(state.kind, "not_available", `expected not_available for sid "${bad}"`);
  }
});

test("NOT_AVAILABLE: no state that supplied a sid is ever DEMO", () => {
  const withSid = [
    resolveReceiptState({ rawSid: VALID_SID, sidIsValid: true, fetchStatus: "not_found" }),
    resolveReceiptState({ rawSid: VALID_SID, sidIsValid: true, fetchStatus: "error" }),
    resolveReceiptState({
      rawSid: VALID_SID,
      sidIsValid: true,
      fetchStatus: "ok",
      parsedHasVisibleContent: false,
    }),
    resolveReceiptState({ rawSid: "nope", sidIsValid: false }),
  ];
  for (const state of withSid) {
    assert.notEqual(state.kind, "demo");
  }
});

// ---- State 3: ERROR ---------------------------------------------------------

test("ERROR: valid sid, network/backend failure", () => {
  assert.deepEqual(
    resolveReceiptState({ rawSid: VALID_SID, sidIsValid: true, fetchStatus: "error" }),
    { kind: "error" },
  );
});

test("ERROR: a valid sid with no fetch outcome fails toward retry, not toward a sample", () => {
  assert.deepEqual(resolveReceiptState({ rawSid: VALID_SID, sidIsValid: true }), { kind: "error" });
});

// ---- State 4: DEMO ----------------------------------------------------------

test("DEMO: no sid at all", () => {
  assert.deepEqual(resolveReceiptState({ rawSid: undefined, sidIsValid: false }), { kind: "demo" });
});

test("DEMO: empty / whitespace-only sid counts as no sid", () => {
  assert.deepEqual(resolveReceiptState({ rawSid: "", sidIsValid: false }), { kind: "demo" });
  assert.deepEqual(resolveReceiptState({ rawSid: "   ", sidIsValid: false }), { kind: "demo" });
});

test("DEMO is the only state that may show the sample", () => {
  const everyState = [
    resolveReceiptState({ rawSid: undefined, sidIsValid: false }),
    resolveReceiptState({ rawSid: VALID_SID, sidIsValid: true, fetchStatus: "not_found" }),
    resolveReceiptState({ rawSid: VALID_SID, sidIsValid: true, fetchStatus: "error" }),
    resolveReceiptState({
      rawSid: VALID_SID,
      sidIsValid: true,
      fetchStatus: "ok",
      parsedHasVisibleContent: true,
    }),
  ];
  assert.equal(everyState.filter((s) => s.kind === "demo").length, 1);
});

test("DEMO: explicit ?demo=1 opt-in with no sid", () => {
  assert.deepEqual(
    resolveReceiptState({ rawSid: undefined, demoRequested: true, sidIsValid: false }),
    { kind: "demo" },
  );
});

test("DEMO: explicit ?demo=1 wins even alongside a well-formed sid (no fetch attempted)", () => {
  assert.deepEqual(
    resolveReceiptState({ rawSid: VALID_SID, demoRequested: true, sidIsValid: true }),
    { kind: "demo" },
  );
});

test("DEMO: explicit ?demo=1 wins even alongside a malformed sid", () => {
  assert.deepEqual(
    resolveReceiptState({ rawSid: "zzzz", demoRequested: true, sidIsValid: false }),
    { kind: "demo" },
  );
});

test("demoRequested defaults to false and does not change sid-present outcomes", () => {
  assert.deepEqual(
    resolveReceiptState({ rawSid: VALID_SID, sidIsValid: true, fetchStatus: "not_found" }),
    { kind: "not_available", reason: "not_found" },
  );
});

// ---- hasVisibleContent ------------------------------------------------------

test("hasVisibleContent: true for the sample receipt (structured)", () => {
  assert.equal(hasVisibleContent(summarizeReceipt(sampleReceiptLines)), true);
});

test("hasVisibleContent: false for zero lines", () => {
  assert.equal(hasVisibleContent(summarizeReceipt([])), false);
});

test("hasVisibleContent: false for blank/whitespace-only lines", () => {
  assert.equal(hasVisibleContent(summarizeReceipt([line(""), line("   "), line("\t")])), false);
});

test("hasVisibleContent: true on body text alone, with no structure extracted", () => {
  // Divider-only lines structure into nothing (no merchant, no total, no
  // items) but are still visible ink on the page, so this is a real — if
  // ugly — receipt and must render, not 404.
  const summary = summarizeReceipt([line("--------"), line("========")]);
  assert.equal(summary.merchantName, undefined);
  assert.equal(summary.total, undefined);
  assert.equal(summary.items.length, 0);
  assert.equal(hasVisibleContent(summary), true);
});

// ---- hasVisibleContent: full-page raster receipts ---------------------------
//
// Blaze prints the whole receipt as a bitmap (see lib/starRaster.ts), so the
// parse yields zero text lines and the ONLY thing standing between a real
// purchase and a "Receipt not available" screen is this flag. The negative
// half matters just as much: the flag must not leak in from a logo.

test("hasVisibleContent: true when a full-page receipt bitmap was decoded, with no text", () => {
  assert.equal(hasVisibleContent(summarizeReceipt([]), { hasFullPageImage: true }), true);
});

test("hasVisibleContent: options default keeps the old text-only semantics", () => {
  assert.equal(hasVisibleContent(summarizeReceipt([])), false);
  assert.equal(hasVisibleContent(summarizeReceipt([]), {}), false);
  assert.equal(hasVisibleContent(summarizeReceipt([]), { hasFullPageImage: false }), false);
});

test("REAL: a text-less receipt resolves to real when it carries a full-page bitmap", () => {
  const summary = summarizeReceipt([]);
  assert.deepEqual(
    resolveReceiptState({
      rawSid: VALID_SID,
      sidIsValid: true,
      fetchStatus: "ok",
      parsedHasVisibleContent: hasVisibleContent(summary, { hasFullPageImage: true }),
    }),
    { kind: "real" },
  );
});

test("NOT_AVAILABLE: a text-less receipt with only a logo-sized image is still nothing to show", () => {
  // app/r/page.tsx passes hasFullPageImage only for bitmaps that clear
  // lib/escpos.ts's FULL_PAGE_MIN_* floors; a logo band never does, so the
  // original "a logo alone is not a receipt" rule is unchanged.
  const summary = summarizeReceipt([]);
  assert.deepEqual(
    resolveReceiptState({
      rawSid: VALID_SID,
      sidIsValid: true,
      fetchStatus: "ok",
      parsedHasVisibleContent: hasVisibleContent(summary, { hasFullPageImage: false }),
    }),
    { kind: "not_available", reason: "empty" },
  );
});

// ---- Summary ----------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
