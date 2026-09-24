// lib/ridSaveLink.test.ts
//
// Standalone test script for the rid "Save in the PapeX app" link gate and
// URL builder — same pattern as lib/appClipBanner.test.ts. Run with:
//   npm run test:ridSaveLink
//
// The load-bearing assertion is the default: it MUST be off, and it MUST
// fail closed for anything but the literal "1" — a stray truthy env value
// would send real iPhone visitors to `links.papex.app` before the 1.7.0 App
// Store build (and the app-side save flow) exist to receive them.

import assert from "node:assert/strict";
import { ridSaveLinkEnabled, ridSaveLinkHref } from "./ridSaveLink";

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

function withEnv(value: string | undefined, fn: () => void) {
  const saved = process.env.RID_SAVE_LINK;
  if (value === undefined) delete process.env.RID_SAVE_LINK;
  else process.env.RID_SAVE_LINK = value;
  try {
    fn();
  } finally {
    if (saved === undefined) delete process.env.RID_SAVE_LINK;
    else process.env.RID_SAVE_LINK = saved;
  }
}

test("default (unset): the save link is OFF", () => {
  withEnv(undefined, () => assert.equal(ridSaveLinkEnabled(), false));
});

test('RID_SAVE_LINK="1" turns it on', () => {
  withEnv("1", () => assert.equal(ridSaveLinkEnabled(), true));
});

test("anything other than the literal \"1\" stays OFF (fails closed)", () => {
  for (const v of ["true", "yes", "TRUE", "0", ""]) {
    withEnv(v, () => assert.equal(ridSaveLinkEnabled(), false, `expected off for "${v}"`));
  }
});

test("href: the exact contract URL for a normal rid", () => {
  assert.equal(
    ridSaveLinkHref("receipt_1776344585632_4mrd9txmk"),
    "https://links.papex.app/r?rid=receipt_1776344585632_4mrd9txmk&save=1",
  );
});

test("href: encodes characters that need escaping", () => {
  assert.equal(ridSaveLinkHref("a b"), "https://links.papex.app/r?rid=a%20b&save=1");
  assert.equal(ridSaveLinkHref("a&b"), "https://links.papex.app/r?rid=a%26b&save=1");
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
