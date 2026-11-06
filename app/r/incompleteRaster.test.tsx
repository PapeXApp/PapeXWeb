// app/r/incompleteRaster.test.tsx
//
// A bitmap receipt whose capture stopped before the end of the print job must
// SAY it is incomplete (lib/starRaster.ts `complete`), never present the top
// of a receipt as the whole of it. Standalone tsx script:
//   npm run test:incompleteRaster

import "./cards/testCssModules"; // must stay first: registers the .css loader before any component loads
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ReceiptView } from "./ui";
import { summarizeReceipt, hasStructure as computeHasStructure } from "@/lib/receiptSummary";
import type { DecodedRasterPage } from "@/lib/escpos";
import { sampleReceiptLines } from "@/lib/sampleReceipt";

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

const NOTICE = "Part of this receipt is missing.";

function page(complete: boolean): DecodedRasterPage {
  return {
    widthPx: 576,
    heightPx: 920,
    dataUri: "data:image/png;base64,AAAA",
    source: "Star Line Mode raster",
    fullPage: true,
    complete,
  };
}

const empty = summarizeReceipt([]);
// The repo's own synthetic sample receipt — no real receipt content.
const structured = summarizeReceipt(sampleReceiptLines);
const merchant = structured.merchantName ?? "";

test("image-only, incomplete: the notice is shown under the image", () => {
  const html = renderToStaticMarkup(
    <ReceiptView summary={empty} hasStructure={false} rasterPage={page(false)} />,
  );
  assert.ok(html.includes(NOTICE), "notice present");
  assert.ok(html.indexOf("<img") < html.indexOf(NOTICE), "notice sits below the image");
  assert.ok(html.includes('role="status"'));
});

test("image-only, complete: no notice (the page renders as before)", () => {
  const html = renderToStaticMarkup(
    <ReceiptView summary={empty} hasStructure={false} rasterPage={page(true)} />,
  );
  assert.ok(!html.includes(NOTICE));
});

test("structured, incomplete: the notice leads, above the designed cards", () => {
  assert.ok(computeHasStructure(structured), "fixture has structure");
  assert.ok(merchant.length > 0, "fixture has a merchant name");
  const html = renderToStaticMarkup(
    <ReceiptView summary={structured} hasStructure rasterPage={page(false)} />,
  );
  assert.ok(html.includes(NOTICE));
  assert.ok(html.indexOf(NOTICE) < html.indexOf(merchant), "notice comes before the merchant card");
});

test("text receipt (no raster page): never a notice", () => {
  const html = renderToStaticMarkup(<ReceiptView summary={structured} hasStructure />);
  assert.ok(!html.includes(NOTICE));
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
