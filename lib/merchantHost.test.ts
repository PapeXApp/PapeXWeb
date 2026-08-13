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


// ---- demo escape hatch (shareable preview deployment) ----------------------

const DEMO_FLAG = "NEXT_PUBLIC_MERCHANT_DEMO_HOST_ANY";

test("demo mode: a vercel preview host IS treated as the merchant host", () => {
  process.env[DEMO_FLAG] = "1";
  assert.equal(isMerchantHost("papexweb-git-merchant-dashboard-x.vercel.app"), true);
  delete process.env[DEMO_FLAG];
});

test("demo mode: root path rewrites into /merchant on a non-merchant host", () => {
  process.env[DEMO_FLAG] = "1";
  assert.deepEqual(resolveMerchantRewrite("papexweb-git-x.vercel.app", "/"), {
    action: "rewrite",
    pathname: "/merchant",
  });
  delete process.env[DEMO_FLAG];
});

test("demo mode: only the literal \"1\" enables it", () => {
  // A stray "true"/"yes"/"" must NOT turn the marketing site into the dashboard.
  for (const v of ["true", "yes", "0", ""]) {
    process.env[DEMO_FLAG] = v;
    assert.equal(isMerchantHost("papex.app"), false, `flag value ${JSON.stringify(v)}`);
  }
  delete process.env[DEMO_FLAG];
});

test("demo mode OFF by default: papex.app is not the merchant host", () => {
  delete process.env[DEMO_FLAG];
  assert.equal(isMerchantHost("papex.app"), false);
});

test("demo mode OFF by default: papex.app/merchant still 404-rewrites", () => {
  delete process.env[DEMO_FLAG];
  assert.deepEqual(resolveMerchantRewrite("papex.app", "/merchant/insights"), {
    action: "rewrite",
    pathname: "/__merchant_not_found__",
  });
});

// ---- production guard -------------------------------------------------------
//
// These are the tests that keep papex.app alive. The demo flag is committed in
// vercel.json's build.env on the merchant demo branch, so if that file is ever
// merged to main the guard below is the only thing preventing the production
// deployment from serving the merchant dashboard in place of the marketing
// site. A failure here is not flakiness — it means that scenario is live.
//
// See the block comment on demoModeEnabled() in lib/merchantHost.ts.

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const saved = new Map<string, string | undefined>();
  for (const [k, v] of Object.entries(vars)) {
    saved.set(k, process.env[k]);
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, v] of saved) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test("PROD GUARD: flag set + VERCEL_ENV=production -> demo mode REFUSED", () => {
  withEnv({ [DEMO_FLAG]: "1", VERCEL: "1", VERCEL_ENV: "production" }, () => {
    assert.equal(isMerchantHost("papex.app"), false);
    assert.deepEqual(resolveMerchantRewrite("papex.app", "/"), { action: "none" });
  });
});

test("PROD GUARD: flag set + VERCEL_ENV=preview -> demo mode allowed", () => {
  withEnv({ [DEMO_FLAG]: "1", VERCEL: "1", VERCEL_ENV: "preview" }, () => {
    assert.equal(isMerchantHost("papexweb-git-merchant-x.vercel.app"), true);
  });
});

test("PROD GUARD: fails closed when VERCEL_ENV is missing on Vercel", () => {
  // System env vars disabled, or a future Vercel change: refuse rather than
  // gamble the marketing site on an absent signal.
  withEnv({ [DEMO_FLAG]: "1", VERCEL: "1", VERCEL_ENV: undefined }, () => {
    assert.equal(isMerchantHost("papex.app"), false);
  });
});

test("PROD GUARD: fails closed on an unrecognised VERCEL_ENV", () => {
  withEnv({ [DEMO_FLAG]: "1", VERCEL: "1", VERCEL_ENV: "staging" }, () => {
    assert.equal(isMerchantHost("papex.app"), false);
  });
});

test("PROD GUARD: local dev (no VERCEL_*) is unaffected by the guard", () => {
  withEnv({ [DEMO_FLAG]: "1", VERCEL: undefined, VERCEL_ENV: undefined }, () => {
    assert.equal(isMerchantHost("localhost:3000"), true);
  });
});

test("PROD GUARD: guard cannot resurrect demo mode without the flag", () => {
  withEnv({ [DEMO_FLAG]: undefined, VERCEL: "1", VERCEL_ENV: "preview" }, () => {
    assert.equal(isMerchantHost("papexweb-git-merchant-x.vercel.app"), false);
  });
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
