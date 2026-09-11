// lib/demoReceipts.test.ts
//
// Standalone test script for the demo-receipt allowlist and the demo routes'
// front door (no test framework in this repo — see package.json). Run with:
//   npm run test:demo
// (uses `tsx`, same pattern as lib/merchantHost.test.ts / lib/escpos.test.ts.)
//
// The load-bearing assertions here are the negative ones. `isDemoSid` only
// ever REMOVES the "Save to PapeX" affordance, so a false negative costs a
// demo its polish, while a false positive silently takes the Save button away
// from a real customer holding a real receipt. Every test below that says
// "not a demo sid" is guarding that direction.

import assert from "node:assert/strict";
import { isValidSid } from "./rdh";
import { DEMO_SIDS, isDemoSid, resolveDemoRoute } from "./demoReceipts";

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

/** The permanent Sunset Leaf booth tag. */
const DEMO_SID = "5371e4f000000001";

/**
 * Shaped exactly like a real one: 16 lowercase hex, as minted by
 * `randomBytes(8).toString("hex")` in the RDH upload Lambda. Nothing about
 * its FORM may be enough to make it a demo sid — only membership in the
 * literal set is.
 */
const PRODUCTION_SID = "a1b2c3d4e5f60718";

// ---- isDemoSid: the positive case -------------------------------------------

test("isDemoSid: the seeded Sunset Leaf demo sid is recognised", () => {
  assert.equal(isDemoSid(DEMO_SID), true);
});

test("isDemoSid: every sid in DEMO_SIDS is recognised", () => {
  for (const sid of DEMO_SIDS) {
    assert.equal(isDemoSid(sid), true, `DEMO_SIDS member ${sid} not recognised`);
  }
});

// ---- isDemoSid: the negative cases that actually matter ---------------------

test("isDemoSid: a production-shaped sid is NOT a demo sid", () => {
  // The whole design rests on this: membership is a literal set, never a
  // pattern. A well-formed sid that nobody listed keeps its Save button.
  assert.equal(isValidSid(PRODUCTION_SID), true, "fixture must be a valid sid");
  assert.equal(isDemoSid(PRODUCTION_SID), false);
});

test("isDemoSid: a sid sharing a prefix with a demo sid is NOT a demo sid", () => {
  // Guards against anyone ever "simplifying" the set into a prefix rule.
  assert.equal(isDemoSid("5371e4f0ffffffff"), false);
  assert.equal(isDemoSid("5371e4f000000002"), false);
});

test("isDemoSid: an invalid sid is rejected", () => {
  assert.equal(isDemoSid("not-a-sid"), false);
  assert.equal(isDemoSid(""), false);
  assert.equal(isDemoSid(undefined), false);
  assert.equal(isDemoSid(null), false);
  // Too short / too long / non-hex — `isValidSid`'s ^[a-f0-9]{16}$.
  assert.equal(isDemoSid("5371e4f00000000"), false);
  assert.equal(isDemoSid("5371e4f0000000011"), false);
  assert.equal(isDemoSid("5371e4f0000000zz"), false);
});

test("isDemoSid: an uppercase spelling of a demo sid is rejected", () => {
  // Not case folded, deliberately: `isValidSid` is lowercase-only and matches
  // the Lambda's SID_RE exactly, so an uppercase sid is not a valid sid at
  // all — anywhere, including here.
  assert.equal(isDemoSid(DEMO_SID.toUpperCase()), false);
});

// ---- the set itself ---------------------------------------------------------

test("DEMO_SIDS: every member is a well-formed sid", () => {
  // Catches a placeholder left uncommented, a typo, a stray uppercase letter,
  // or a pasted sid with whitespace — any of which would silently make an
  // entry unmatchable and hand a demo tag its Save button back.
  for (const sid of DEMO_SIDS) {
    assert.equal(isValidSid(sid), true, `DEMO_SIDS member ${JSON.stringify(sid)} is not a valid sid`);
  }
});

test("DEMO_SIDS: contains the seeded Sunset Leaf sid", () => {
  assert.equal(DEMO_SIDS.has(DEMO_SID), true);
});

// ---- resolveDemoRoute: /r/demo and /demo/r's front door ---------------------

test("resolveDemoRoute: a demo sid renders", () => {
  assert.deepEqual(resolveDemoRoute(DEMO_SID), { action: "render", sid: DEMO_SID });
});

test("resolveDemoRoute: a production sid REDIRECTS to /r (fail toward production)", () => {
  // The single most important behaviour of the demo route. A real customer's
  // receipt reaching a demo URL must come out the other side with production
  // semantics — never the reverse.
  assert.deepEqual(resolveDemoRoute(PRODUCTION_SID), {
    action: "redirect",
    url: `/r?sid=${PRODUCTION_SID}`,
  });
});

test("resolveDemoRoute: a malformed sid redirects to /r and keeps the sid", () => {
  // `/r` is the route that knows how to say "Receipt not available" for a
  // malformed sid; don't duplicate that judgement in the demo route.
  assert.deepEqual(resolveDemoRoute("not-a-sid"), {
    action: "redirect",
    url: "/r?sid=not-a-sid",
  });
});

test("resolveDemoRoute: a sid needing encoding is escaped, not interpolated raw", () => {
  const d = resolveDemoRoute("a&b=c d");
  assert.equal(d.action, "redirect");
  if (d.action === "redirect") {
    assert.equal(d.url, "/r?sid=a%26b%3Dc%20d");
  }
});

test("resolveDemoRoute: no sid at all redirects to bare /r", () => {
  assert.deepEqual(resolveDemoRoute(undefined), { action: "redirect", url: "/r" });
  assert.deepEqual(resolveDemoRoute(null), { action: "redirect", url: "/r" });
  assert.deepEqual(resolveDemoRoute(""), { action: "redirect", url: "/r" });
  assert.deepEqual(resolveDemoRoute("   "), { action: "redirect", url: "/r" });
});

// ---- Summary -----------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
