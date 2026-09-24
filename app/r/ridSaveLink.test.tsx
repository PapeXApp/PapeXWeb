// app/r/ridSaveLink.test.tsx
//
// Issue #23's web slice: the "Save in the PapeX app" link on `/r?rid=`.
// Standalone tsx script (see package.json):
//   npm run test:ridSaveLinkRender
//
// Drives the real page component the same way ./receiptPage.parity.test.tsx
// does (see ./testPageHarness.tsx), but doesn't reuse ./testRunScenario.ts's
// `Scenario` type: that type only distinguishes "android" vs the default
// iPhone UA, and this needs a genuine desktop UA plus RID_SAVE_LINK env
// toggling per case, neither of which the shared parity harness models.
//
// What this proves:
//   - RID_SAVE_LINK unset (default OFF) and set to anything but the literal
//     "1": rid, sid and bare pages render BYTE-IDENTICAL to
//     ./receiptPage.parity.test.tsx's own goldens — checked directly against
//     those golden files, so this can't drift from the parity lock.
//   - RID_SAVE_LINK=1 + an iPhone UA on a real (existing, well-formed) rid:
//     the link is present with the exact contract href
//     (https://links.papex.app/r?rid=<rid>&save=1).
//   - RID_SAVE_LINK=1 + Android or desktop UA: absent.
//   - RID_SAVE_LINK=1 on sid pages (real + demo sid), the bare/demo sample,
//     a malformed rid, and a rid that 404s: absent in every case — this is a
//     rid-only link, and only for a rid that actually resolved to a receipt.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ANDROID_UA,
  IPHONE_UA,
  RDH,
  SHARED,
  bytes,
  finish,
  json,
  renderHtml,
  setUpstreams,
  status,
  test,
  testRequest,
  type Upstream,
} from "./testPageHarness";
import ReceiptPage from "./page";
import { HARTWELLS_BLOB } from "@/lib/__fixtures__/demoBlobs";

const RID = "receipt_1776344585632_4mrd9txmk";
const SID_TEXT = "a1b2c3d4e5f60718";
const HARTWELLS = "5ca1e00000000001";

const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

const SHARED_OK = {
  sid: RID,
  parseStatus: "ok",
  hasImage: false,
  uploadedAt: "2026-04-16T13:03:05.632Z",
  receipt: {
    merchantName: "CASH RECEIPT",
    merchantAddress: null,
    date: "2018-01-01 • 10:35",
    subtotal: null,
    tax: null,
    total: 84.8,
    lineItems: [{ name: "Item", quantity: 1, price: 84.8, sku: null }],
    paymentMethod: null,
    cardBrand: null,
    cardLast4: null,
    receiptNumber: null,
    confidence: null,
    extractorEngine: null,
  },
};

const EXPECT_HREF = `https://links.papex.app/r?rid=${RID}&save=1`;
// React/Fizz HTML-escapes attribute values, so `&` comes out as `&amp;`.
const EXPECT_HREF_ATTR = `https://links.papex.app/r?rid=${RID}&amp;save=1`;
const LINK_TEXT = "Save in the PapeX app";
// The save-link's own href shape — distinct from the pre-existing sid-only
// `https://links.papex.app/rdh?sid=...` universal link that CtaRow's
// SaveToPapex already renders on every real sid page (see r-hartwells /
// sid-text goldens), so a bare "links.papex.app" substring check would be a
// false positive there.
const SAVE_LINK_HREF_MARKER = "links.papex.app/r?rid=";

async function withEnv(value: string | undefined, fn: () => Promise<void> | void) {
  const saved = process.env.RID_SAVE_LINK;
  if (value === undefined) delete process.env.RID_SAVE_LINK;
  else process.env.RID_SAVE_LINK = value;
  try {
    await fn();
  } finally {
    if (saved === undefined) delete process.env.RID_SAVE_LINK;
    else process.env.RID_SAVE_LINK = saved;
  }
}

async function renderRid(ua: string) {
  testRequest.userAgent = ua;
  setUpstreams({ [`${SHARED}/sharedReceipt?rid=${RID}`]: json(200, SHARED_OK) });
  const el = await ReceiptPage({ searchParams: Promise.resolve({ rid: RID }) });
  return renderHtml(el);
}

async function renderSid(sid: string, upstreams: Record<string, Upstream>, ua: string = IPHONE_UA) {
  testRequest.userAgent = ua;
  setUpstreams(upstreams);
  const el = await ReceiptPage({ searchParams: Promise.resolve({ sid }) });
  return renderHtml(el);
}

const PARITY_DIR = join(__dirname, "__parity__");
const golden = (name: string) => readFileSync(join(PARITY_DIR, `${name}.html`), "utf8");

async function main() {
  // ---- flag off: byte-identical to today, in every shape ------------------------

  await test("flag unset (default): rid-ok renders byte-identical to its parity golden", async () => {
    await withEnv(undefined, async () => {
      const html = await renderRid(IPHONE_UA);
      assert.equal(html, golden("rid-ok"));
      assert.ok(!html.includes(LINK_TEXT));
    });
  });

  await test('flag "0" (fails closed, anything but "1"): still byte-identical', async () => {
    await withEnv("0", async () => {
      const html = await renderRid(IPHONE_UA);
      assert.equal(html, golden("rid-ok"));
    });
  });

  await test("flag on: a sid page is untouched (byte-identical to its own golden)", async () => {
    await withEnv("1", async () => {
      const html = await renderSid(SID_TEXT, {
        [`${RDH}/receipt/${SID_TEXT}`]: bytes(HARTWELLS_BLOB.bytes),
        [`${RDH}/receipt/${SID_TEXT}/parsed`]: status(404),
      });
      assert.equal(html, golden("sid-text"));
      assert.ok(!html.includes(LINK_TEXT));
      assert.ok(!html.includes(SAVE_LINK_HREF_MARKER));
    });
  });

  await test("flag on: a demo sid on /r is untouched", async () => {
    await withEnv("1", async () => {
      const html = await renderSid(HARTWELLS, { [`${RDH}/receipt/${HARTWELLS}`]: bytes(HARTWELLS_BLOB.bytes) });
      assert.equal(html, golden("r-hartwells"));
      assert.ok(!html.includes(LINK_TEXT));
    });
  });

  await test("flag on: bare /r (the sample) is untouched", async () => {
    await withEnv("1", async () => {
      testRequest.userAgent = IPHONE_UA;
      setUpstreams({});
      const el = await ReceiptPage({ searchParams: Promise.resolve({}) });
      const html = await renderHtml(el);
      assert.equal(html, golden("bare"));
      assert.ok(!html.includes(LINK_TEXT));
    });
  });

  await test("flag on: a malformed rid never shows the link (no save without a valid rid)", async () => {
    await withEnv("1", async () => {
      testRequest.userAgent = IPHONE_UA;
      setUpstreams({});
      const el = await ReceiptPage({ searchParams: Promise.resolve({ rid: "has space" }) });
      const html = await renderHtml(el);
      assert.equal(html, golden("rid-malformed"));
      assert.ok(!html.includes(LINK_TEXT));
    });
  });

  await test("flag on: a rid that 404s (not_available) never shows the link", async () => {
    await withEnv("1", async () => {
      testRequest.userAgent = IPHONE_UA;
      setUpstreams({ [`${SHARED}/sharedReceipt?rid=${RID}`]: status(404) });
      const el = await ReceiptPage({ searchParams: Promise.resolve({ rid: RID }) });
      const html = await renderHtml(el);
      assert.equal(html, golden("rid-not-found"));
      assert.ok(!html.includes(LINK_TEXT));
    });
  });

  // ---- flag on: the link itself ---------------------------------------------------

  await test("flag on + iPhone UA + a real rid: the link is present with the exact contract href", async () => {
    await withEnv("1", async () => {
      const html = await renderRid(IPHONE_UA);
      assert.ok(html.includes(LINK_TEXT), "link text missing");
      assert.ok(html.includes(`href="${EXPECT_HREF_ATTR}"`), `expected href ${EXPECT_HREF} in:\n${html}`);
      // Directly after AppCta, inside the same Shell — not replacing it.
      assert.ok(html.includes("Get PapeX on the App Store"), "AppCta must stay");
    });
  });

  await test("flag on + Android UA: absent (server save for Android is 1.7.1)", async () => {
    await withEnv("1", async () => {
      const html = await renderRid(ANDROID_UA);
      assert.ok(!html.includes(LINK_TEXT));
      assert.ok(!html.includes(SAVE_LINK_HREF_MARKER));
    });
  });

  await test("flag on + desktop UA: absent", async () => {
    await withEnv("1", async () => {
      const html = await renderRid(DESKTOP_UA);
      assert.ok(!html.includes(LINK_TEXT));
      assert.ok(!html.includes(SAVE_LINK_HREF_MARKER));
    });
  });

  finish();
}

main();
