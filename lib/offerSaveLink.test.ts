// lib/offerSaveLink.test.ts
//
// Standalone test script for the offer-card "Save in the PapeX app" flag —
// same pattern as lib/ridSaveLink.test.ts / lib/appClipBanner.test.ts. Run
// with:
//   npm run test:offerSaveLink
//
// The load-bearing assertion is the default: it MUST be off, and it MUST
// fail closed for anything but the literal "1" — a stray truthy env value
// would send real iPhone visitors to `links.papex.app` before Noah has
// decided to flip it.

import assert from "node:assert/strict";
import { offerSaveLinkEnabled } from "./offerSaveLink";

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
  const saved = process.env.OFFER_SAVE_LINK;
  if (value === undefined) delete process.env.OFFER_SAVE_LINK;
  else process.env.OFFER_SAVE_LINK = value;
  try {
    fn();
  } finally {
    if (saved === undefined) delete process.env.OFFER_SAVE_LINK;
    else process.env.OFFER_SAVE_LINK = saved;
  }
}

test("default (unset): the save link is OFF", () => {
  withEnv(undefined, () => assert.equal(offerSaveLinkEnabled(), false));
});

test('OFFER_SAVE_LINK="1" turns it on', () => {
  withEnv("1", () => assert.equal(offerSaveLinkEnabled(), true));
});

test("anything other than the literal \"1\" stays OFF (fails closed)", () => {
  for (const v of ["true", "yes", "TRUE", "0", ""]) {
    withEnv(v, () => assert.equal(offerSaveLinkEnabled(), false, `expected off for "${v}"`));
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
