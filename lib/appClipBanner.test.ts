// lib/appClipBanner.test.ts
//
// Standalone test script for the rid App Clip banner gate (no test framework
// in this repo — see package.json). Run with:
//   npm run test:banner
//
// The load-bearing assertion is the default: it MUST be off, because the App
// Clip build live on the App Store today can't parse `rid` (see
// lib/appClipBanner.ts's doc comment) — a stray truthy env value flipping
// this on by accident would send real iPhone users into the clip's
// "Receipt ID is missing" dead end instead of this web page.

import assert from "node:assert/strict";
import { APP_CLIP_BANNER_CONTENT, ridAppClipBannerEnabled } from "./appClipBanner";

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
  const saved = process.env.RID_APP_CLIP_BANNER;
  if (value === undefined) delete process.env.RID_APP_CLIP_BANNER;
  else process.env.RID_APP_CLIP_BANNER = value;
  try {
    fn();
  } finally {
    if (saved === undefined) delete process.env.RID_APP_CLIP_BANNER;
    else process.env.RID_APP_CLIP_BANNER = saved;
  }
}

test("default (unset): the rid banner is OFF", () => {
  withEnv(undefined, () => assert.equal(ridAppClipBannerEnabled(), false));
});

test('RID_APP_CLIP_BANNER="1" turns it on', () => {
  withEnv("1", () => assert.equal(ridAppClipBannerEnabled(), true));
});

test("anything other than the literal \"1\" stays OFF (fails closed)", () => {
  for (const v of ["true", "yes", "TRUE", "0", ""]) {
    withEnv(v, () => assert.equal(ridAppClipBannerEnabled(), false, `expected off for "${v}"`));
  }
});

test("the banner content carries the documented app id and clip bundle id", () => {
  assert.match(APP_CLIP_BANNER_CONTENT, /app-id=6754945242/);
  assert.match(APP_CLIP_BANNER_CONTENT, /app-clip-bundle-id=com\.app\.papex\.Clip/);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
