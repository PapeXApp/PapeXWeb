// app/w/wLoyalty.test.tsx
//
// Dutchie r2 through the real pages: printed tax lines and fees on /r and /w,
// the loyalty block on /w only. Standalone tsx script:  npm run test:wLoyalty

import assert from "node:assert/strict";
import { finish, test, RDH, ANDROID_UA, IPHONE_UA, bytes, json, renderHtml, setUpstreams, testRequest } from "../r/testPageHarness";
import ReceiptPage from "../r/page";
import WPage from "./page";
import { DUTCHIE_BUNDLE_BYTES_B64, DUTCHIE_PARSED_BUNDLE } from "@/lib/__fixtures__/dutchieParsed";
import { DUTCHIE_R2_FEE, DUTCHIE_R2_MEMBER, DUTCHIE_R2_NONMEMBER } from "@/lib/__fixtures__/dutchieParsedR2";

const SID = "d0c0ffee00000003";
const BIN = Uint8Array.from(Buffer.from(DUTCHIE_BUNDLE_BYTES_B64, "base64"));
const sp = { searchParams: Promise.resolve({ sid: SID }) };
const text = (html: string) =>
  html.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");

async function render(page: "r" | "w", parsed: unknown, ua = IPHONE_UA) {
  testRequest.userAgent = ua;
  try {
    setUpstreams({ [`${RDH}/receipt/${SID}`]: bytes(BIN), [`${RDH}/receipt/${SID}/parsed`]: json(200, parsed) });
    return await renderHtml(await (page === "r" ? ReceiptPage(sp) : WPage(sp)));
  } finally {
    testRequest.userAgent = IPHONE_UA;
  }
}

async function main() {
  await test("tax components and fees render as printed, with no derived rate (/r and /w)", async () => {
    for (const page of ["r", "w"] as const) {
      const t = text(await render(page, DUTCHIE_R2_FEE));
      for (const s of ["CA Sales 8.625% $0.60", "CA Excise 15% $0.90", "Pay By Bank Fee $0.26", "Subtotal $8.50", "Discount -$2.50", "Total $7.76"]) {
        assert.ok(t.includes(s), `${page}: missing ${s}`);
      }
      assert.ok(!/Tax \(/.test(t), `${page}: no blended "Tax (x%)" row`);
    }
  });

  await test("/w: a member sees their points; /r does not", async () => {
    const line = "You earned 0.96 points · Balance 13.30 points";
    assert.ok(text(await render("w", DUTCHIE_R2_MEMBER)).includes(line));
    assert.ok(!text(await render("r", DUTCHIE_R2_MEMBER)).includes(line));
  });

  await test("/w: a non-member gets Union's enroll link (new tab); /r does not", async () => {
    const w = await render("w", DUTCHIE_R2_NONMEMBER);
    assert.match(
      w,
      /<a href="https:\/\/unioncannabisclub\.com\/#menu" target="_blank" rel="noopener noreferrer"[^>]*>Not a rewards member yet\? Join Union(&#x27;|')s rewards with your email →<\/a>/,
    );
    const r = await render("r", DUTCHIE_R2_NONMEMBER);
    assert.ok(!r.includes("unioncannabisclub.com"));
  });

  await test("/w without a loyalty block renders exactly what /r renders (Android)", async () => {
    assert.equal(await render("w", DUTCHIE_PARSED_BUNDLE, ANDROID_UA), await render("r", DUTCHIE_PARSED_BUNDLE, ANDROID_UA));
  });

  finish();
}

void main();
