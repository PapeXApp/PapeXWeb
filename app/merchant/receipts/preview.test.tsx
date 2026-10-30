// app/merchant/receipts/preview.test.tsx
//
// Run with: npm run test:merchantReceipts
//
// The preview draws through the real pipeline: this renders it to markup and
// checks that the customer type and surface change what the real card views
// draw, and that the licence line can't go missing.

import "@/app/r/cards/testCssModules";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { encodeEscPos, defaultStyle } from "@/lib/escpos";
import { MOCK_CARD_CONFIG } from "@/lib/merchantReceipts/mockConfig";
import { draftToConfig, fromConfig } from "@/lib/merchantReceipts/draft";
import type { CardConfig, LiveSurface, LoyaltySegment } from "@/lib/merchantReceipts/types";

const NOW = new Date("2026-10-30T20:00:00.000Z");
const SID = "0123456789abcdef";
const plain = defaultStyle();
const BYTES = encodeEscPos(
  ["SUNSET LEAF CO.", "1847 Irving St", "", "Blue Dream 3.5G  32.00", "", "Subtotal  32.00", "TOTAL  32.00", "", "CASH"].map((text) => ({ text, align: "left" as const, style: plain })),
);

async function main() {
  const { PreviewBody } = await import("./ReceiptPreview");
  const draw = (config: CardConfig, segment: LoyaltySegment, surface: LiveSurface, state = { enabled: true, revokedCardIds: [] as string[] }) =>
    renderToStaticMarkup(<PreviewBody config={config} state={state} segment={segment} surface={surface} receiptBytes={BYTES} sid={SID} now={NOW} />);

  const first = draw(MOCK_CARD_CONFIG, "first", "web");
  const returning = draw(MOCK_CARD_CONFIG, "returning", "web");
  assert.ok(first.includes("WELCOME20") && !first.includes("MEMBER10"), "first-time gets the welcome code");
  assert.ok(returning.includes("MEMBER10") && !returning.includes("WELCOME20"), "returning gets the member code");
  assert.ok(draw(MOCK_CARD_CONFIG, "unknown", "web").includes("MEMBER10"), "can't tell falls to the member offer");
  assert.ok(draw(MOCK_CARD_CONFIG, "no_points", "web").includes("WELCOME20"));

  assert.ok(first.includes("SUNSET LEAF CO."), "the merchant's real receipt is drawn");
  assert.ok(first.includes("Blue Dream"));

  assert.ok(first.includes("Demo store: fictional dispensary, no cannabis licence."), "the licence line is on the offer");
  assert.ok(first.includes("not a real purchase"), "the disclosure is drawn");

  assert.ok(!first.includes("Save to PapeX"), "no Save on the web");
  assert.ok(!draw(MOCK_CARD_CONFIG, "first", "clip").includes("Save to PapeX"), "no Save in the clip");
  assert.ok(draw(MOCK_CARD_CONFIG, "first", "app").includes("Save to PapeX"), "Save in the app");

  // Live edits reach the voucher.
  const edited = fromConfig(MOCK_CARD_CONFIG);
  edited.offers[0].template.valueLabel = "35%";
  edited.offers[0].template.redemption = { type: "code", code: { mode: "static", value: "NEWCODE" } };
  const editedHtml = draw(draftToConfig(edited, MOCK_CARD_CONFIG), "first", "web");
  assert.ok(editedHtml.includes("35%") && editedHtml.includes("NEWCODE") && !editedHtml.includes("WELCOME20"));

  // Order, on/off, surfaces, a QR.
  const receiptAt = (html: string) => html.indexOf("Blue Dream");
  const offerAt = (html: string) => html.indexOf("WELCOME20");
  assert.ok(receiptAt(first) < offerAt(first), "below the receipt by default");
  const above = fromConfig(MOCK_CARD_CONFIG);
  above.order = "cards-first";
  const aboveHtml = draw(draftToConfig(above, MOCK_CARD_CONFIG), "first", "web");
  assert.ok(offerAt(aboveHtml) < receiptAt(aboveHtml), "above the receipt when chosen");

  const off = fromConfig(MOCK_CARD_CONFIG);
  off.enabled = false;
  const offHtml = draw(draftToConfig(off, MOCK_CARD_CONFIG), "first", "web");
  assert.ok(!offHtml.includes("WELCOME20") && !offHtml.includes("not a real purchase") && offHtml.includes("Blue Dream"), "offers off: only the receipt");
  assert.ok(!draw(MOCK_CARD_CONFIG, "first", "web", { enabled: false, revokedCardIds: [] }).includes("WELCOME20"), "paused by PapeX");

  const clipOnly = fromConfig(MOCK_CARD_CONFIG);
  clipOnly.offers[0].surfaces = ["clip"];
  const clipConfig = draftToConfig(clipOnly, MOCK_CARD_CONFIG);
  assert.ok(draw(clipConfig, "first", "clip").includes("WELCOME20"));
  assert.ok(!draw(clipConfig, "first", "web").includes("WELCOME20"));

  const qr = fromConfig(MOCK_CARD_CONFIG);
  qr.offers[0].template.redemption = { type: "barcode", symbology: "qr", code: { mode: "static", value: "WELCOME20" }, text: "WELCOME20" };
  assert.ok(draw(draftToConfig(qr, MOCK_CARD_CONFIG), "first", "web").includes("<svg"), "a QR is really drawn");

  // Invalid mid-typing: the card is dropped, the receipt stays, nothing throws.
  const broken = fromConfig(MOCK_CARD_CONFIG);
  broken.offers[0].template.title = "";
  const brokenHtml = draw(draftToConfig(broken, MOCK_CARD_CONFIG), "first", "web");
  assert.ok(brokenHtml.includes("Blue Dream"));
  assert.ok(!brokenHtml.includes("WELCOME20"));

  // No receipt yet: the page says it's a sample.
  const sample = renderToStaticMarkup(
    <PreviewBody config={MOCK_CARD_CONFIG} state={{ enabled: true, revokedCardIds: [] }} segment="first" surface="web" receiptBytes={null} sid={SID} now={NOW} />,
  );
  assert.ok(sample.includes("Sample data"), "a sample receipt is marked");

  console.log("merchant receipts preview: all passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
