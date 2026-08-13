// lib/deployEnv.test.ts
//
// The gate that keeps the merchant demo flags off production. Run with:
//   npm run test:deployEnv
// (no test framework in this repo — same tsx-script pattern as
// lib/merchantHost.test.ts / lib/escpos.test.ts.)
//
// Both flags in vercel.json's build.env pass through demoOverridesAllowed().
// If these cases fail, either papex.app is one merge away from serving the
// merchant dashboard, or a real merchant is one merge away from being shown
// invented transactions. Treat a failure here as that, not as a flaky test.

import assert from "node:assert/strict";
import { demoOverridesAllowed } from "./deployEnv";

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

const VARS = ["VERCEL", "VERCEL_ENV", "NEXT_PUBLIC_VERCEL_ENV"] as const;

function withEnv(vars: Partial<Record<(typeof VARS)[number], string>>, fn: () => void) {
  const saved = VARS.map((k) => [k, process.env[k]] as const);
  for (const k of VARS) delete process.env[k];
  for (const [k, v] of Object.entries(vars)) if (v !== undefined) process.env[k] = v;
  try {
    fn();
  } finally {
    for (const [k, v] of saved) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

// ---- allowed --------------------------------------------------------------

test("local dev (no VERCEL_* at all) -> allowed", () => {
  withEnv({}, () => assert.equal(demoOverridesAllowed(), true));
});

test("vercel preview, server runtime (VERCEL_ENV) -> allowed", () => {
  withEnv({ VERCEL: "1", VERCEL_ENV: "preview" }, () =>
    assert.equal(demoOverridesAllowed(), true)
  );
});

test("vercel preview, browser bundle (NEXT_PUBLIC_VERCEL_ENV only) -> allowed", () => {
  // The client bundle never sees VERCEL or VERCEL_ENV — only the
  // NEXT_PUBLIC_-prefixed mirror. lib/merchantApi.ts's mock flag is read here.
  withEnv({ NEXT_PUBLIC_VERCEL_ENV: "preview" }, () =>
    assert.equal(demoOverridesAllowed(), true)
  );
});

test("vercel development deployment -> allowed", () => {
  withEnv({ VERCEL: "1", VERCEL_ENV: "development" }, () =>
    assert.equal(demoOverridesAllowed(), true)
  );
});

// ---- refused (these are the ones that matter) ------------------------------

test("PROD: vercel production, server runtime -> REFUSED", () => {
  withEnv({ VERCEL: "1", VERCEL_ENV: "production" }, () =>
    assert.equal(demoOverridesAllowed(), false)
  );
});

test("PROD: vercel production, browser bundle -> REFUSED", () => {
  withEnv({ NEXT_PUBLIC_VERCEL_ENV: "production" }, () =>
    assert.equal(demoOverridesAllowed(), false)
  );
});

test("PROD: on Vercel with no environment reported -> REFUSED (fails closed)", () => {
  withEnv({ VERCEL: "1" }, () => assert.equal(demoOverridesAllowed(), false));
});

test("PROD: unrecognised environment name -> REFUSED (fails closed)", () => {
  withEnv({ VERCEL: "1", VERCEL_ENV: "staging" }, () =>
    assert.equal(demoOverridesAllowed(), false)
  );
});

test("PROD: mirrors disagree, either saying production -> REFUSED", () => {
  withEnv({ VERCEL: "1", VERCEL_ENV: "production", NEXT_PUBLIC_VERCEL_ENV: "preview" }, () =>
    assert.equal(demoOverridesAllowed(), false)
  );
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
