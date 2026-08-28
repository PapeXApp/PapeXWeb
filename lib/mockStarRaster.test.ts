// Tests for lib/mockStarRaster.ts — the mock "ok_raster" fixture generator.
//
// This fixture is what a developer running NEXT_PUBLIC_MERCHANT_MOCK=1 sees
// on the merchant receipt-detail page, and it is the only place the merchant
// dashboard's raster rendering path gets exercised without live Blaze
// hardware. If it silently stopped being detected as raster, or decoded
// below the full-page floor, the mock would quietly fall back to the
// "couldn't load the image" card and the path would look broken — or worse,
// look fine while rendering nothing. These tests pin it.

import assert from "node:assert/strict";
import { buildMockStarRasterJob, RASTER_WIDTH_DOTS } from "./mockStarRaster";
import { decodeStarRaster, looksLikeStarRaster } from "./starRaster";
import { parseEscPos } from "./escpos";

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

test("the generated job is detected as Star raster", () => {
  assert.ok(looksLikeStarRaster(buildMockStarRasterJob()));
});

test("it decodes at the pilot's real width", () => {
  const img = decodeStarRaster(buildMockStarRasterJob());
  assert.ok(img, "decoded");
  assert.equal(img!.widthPx, RASTER_WIDTH_DOTS);
  assert.equal(img!.widthPx, 552);
});

test("it clears the full-page floor, so it counts as receipt content", () => {
  const parsed = parseEscPos(buildMockStarRasterJob());
  assert.ok(parsed.rasterPage, "parseEscPos surfaced a rasterPage");
  // Below this the bitmap is treated as a logo band and shows nothing —
  // see FULL_PAGE_MIN_HEIGHT_DOTS in lib/escpos.ts.
  assert.ok(parsed.rasterPage!.heightPx > 200, `height ${parsed.rasterPage!.heightPx} clears the 200-dot floor`);
  assert.equal(parsed.rasterPage!.fullPage, true);
});

test("it carries no text lines — the bitmap IS the receipt", () => {
  const parsed = parseEscPos(buildMockStarRasterJob());
  assert.equal(parsed.lines.length, 0);
});

test("blank space is encoded as ESC * r Y feeds, not as rows of zeroes", () => {
  // The feeds are what preserve vertical layout; a decoder that drops them
  // renders the receipt squashed. If this fixture stopped using them it
  // would stop covering that failure mode.
  const bytes = buildMockStarRasterJob();
  let feeds = 0;
  for (let i = 0; i + 3 < bytes.length; i++) {
    if (bytes[i] === 0x1b && bytes[i + 1] === 0x2a && bytes[i + 2] === 0x72 && bytes[i + 3] === 0x59) feeds += 1;
  }
  assert.ok(feeds > 5, `found ${feeds} feed commands`);
});

test("it is deterministic — the mock must not shift under a developer", () => {
  assert.deepEqual(buildMockStarRasterJob(), buildMockStarRasterJob());
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
