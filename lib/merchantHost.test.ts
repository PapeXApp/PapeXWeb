// lib/merchantHost.test.ts
//
// Standalone test script for the merchant-subdomain routing logic (no test
// framework in this repo — see package.json). Run with:
//   npm run test:merchantHost
// (uses `tsx`, same pattern as lib/escpos.test.ts / lib/receiptSummary.test.ts.)

import assert from "node:assert/strict";
import { isMerchantHost, resolveMerchantRewrite } from "./merchantHost";

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

// ---- isMerchantHost ---------------------------------------------------------

test("isMerchantHost: true for merchant.papex.app", () => {
  assert.equal(isMerchantHost("merchant.papex.app"), true);
});

test("isMerchantHost: true with a dev port suffix", () => {
  assert.equal(isMerchantHost("merchant.papex.app:3000"), true);
});

test("isMerchantHost: false for the main host", () => {
  assert.equal(isMerchantHost("papex.app"), false);
});

test("isMerchantHost: false for links.papex.app (a different subdomain)", () => {
  assert.equal(isMerchantHost("links.papex.app"), false);
});

test("isMerchantHost: case-insensitive", () => {
  assert.equal(isMerchantHost("MERCHANT.PAPEX.APP"), true);
});

// ---- resolveMerchantRewrite: merchant host ----------------------------------

test("merchant host, root path -> rewrite to /merchant", () => {
  const d = resolveMerchantRewrite("merchant.papex.app", "/");
  assert.deepEqual(d, { action: "rewrite", pathname: "/merchant" });
});

test("merchant host, /insights -> rewrite to /merchant/insights", () => {
  const d = resolveMerchantRewrite("merchant.papex.app", "/insights");
  assert.deepEqual(d, { action: "rewrite", pathname: "/merchant/insights" });
});

test("merchant host, nested path -> rewrite preserves the whole path", () => {
  const d = resolveMerchantRewrite("merchant.papex.app", "/tx/abc123def4567890");
  assert.deepEqual(d, { action: "rewrite", pathname: "/merchant/tx/abc123def4567890" });
});

test("merchant host, path already prefixed -> no double-prefix", () => {
  const d = resolveMerchantRewrite("merchant.papex.app", "/merchant/insights");
  assert.deepEqual(d, { action: "none" });
});

// ---- resolveMerchantRewrite: non-merchant host -------------------------------

test("main host, /merchant/* -> rewritten to a 404-triggering path", () => {
  const d = resolveMerchantRewrite("papex.app", "/merchant/insights");
  assert.equal(d.action, "rewrite");
  if (d.action === "rewrite") {
    assert.equal(d.pathname, "/__merchant_not_found__");
  }
});

test("main host, bare /merchant -> also blocked", () => {
  const d = resolveMerchantRewrite("papex.app", "/merchant");
  assert.equal(d.action, "rewrite");
});

test("main host, unrelated path -> untouched", () => {
  const d = resolveMerchantRewrite("papex.app", "/r");
  assert.deepEqual(d, { action: "none" });
});

test("main host, root -> untouched", () => {
  const d = resolveMerchantRewrite("papex.app", "/");
  assert.deepEqual(d, { action: "none" });
});

test("links host (a different subdomain, not merchant), /rdh -> untouched", () => {
  const d = resolveMerchantRewrite("links.papex.app", "/rdh");
  assert.deepEqual(d, { action: "none" });
});

// ---- Summary -----------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
