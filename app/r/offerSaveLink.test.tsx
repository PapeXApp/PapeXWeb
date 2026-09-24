// app/r/offerSaveLink.test.tsx
//
// The offer-card "Save in the PapeX app" link on `/r?sid=` (lib/offerSaveLink.ts,
// app/r/cards/WebCards.tsx). Standalone tsx script (see package.json):
//   npm run test:offerSaveLinkRender
//
// Drives the real page component the same way ./receiptPage.cards.test.tsx
// and ./ridSaveLink.test.tsx do (see ./testPageHarness.tsx), against the
// production sid variant fixtures under contracts/cards/v1/fixtures/variants/
// so this exercises the exact server response shape, not a hand-rolled one.
//
// What this proves:
//   - OFFER_SAVE_LINK unset (default OFF): a sid page with a real offer card
//     renders BYTE-IDENTICAL to ./receiptPage.cards.test.tsx's own
//     `expectedStack`-derived output — checked directly, so this can't drift
//     from that suite's contract-fixture coverage.
//   - OFFER_SAVE_LINK=1 + iPhone UA + an offer card, inline (cards settle
//     before the receipt) in BOTH layouts (receipt-first and cards-first):
//     the link is present with the exact hand-off href
//     (https://links.papex.app/rdh?sid=<sid>), placed directly after the
//     card stack.
//   - OFFER_SAVE_LINK=1 + iPhone UA + an offer card, STREAMED (cards settle
//     after the receipt): same link, same href, in the slot that actually
//     fills.
//   - OFFER_SAVE_LINK=1 + iPhone UA + cards with NO offer card (text-only,
//     cta-only): absent — a save hand-off next to a card the app can't act
//     on (no `save` action target) would be misleading.
//   - OFFER_SAVE_LINK=1 + iPhone UA + no cards at all (cards service down):
//     absent — nothing to save.
//   - OFFER_SAVE_LINK=1 + Android or desktop UA: absent, even with a real
//     offer card (iOS-only — see lib/offerSaveLink.ts for why).
//   - OFFER_SAVE_LINK=1 on a demo sid: absent (mayFetchWebCards already
//     excludes demo sids from the cards call entirely).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  ANDROID_UA,
  IPHONE_UA,
  RDH,
  bytes,
  finish,
  renderHtml,
  setUpstreams,
  status,
  test,
  testClock,
  testRequest,
} from "./testPageHarness";
import ReceiptPage from "./page";
import { WebCardStack } from "./cards/WebCards";
import { parseCardsResponse } from "@/lib/cards/normalize";
import { restrictToWebCaps, webCardsUrl } from "@/lib/cards/fetchCards";
import { HARTWELLS_BLOB, ELLSWORTH_BLOB } from "@/lib/__fixtures__/demoBlobs";

const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

const ROOT = resolve(__dirname, "../..");
const VARIANTS = join(ROOT, "contracts/cards/v1/fixtures/variants");
const readVariant = (f: string) => readFileSync(join(VARIANTS, f), "utf8");

const LINK_TEXT = "Save in the PapeX app";
const OFFER_SID_RECEIPT_FIRST = "7e57ca4d00000001"; // rf-offer-code128, hartwells, receipt-first
const OFFER_SID_CARDS_FIRST = "7e57ca4d00000002"; // cf-offer-code128, hartwells, cards-first
const TEXT_ONLY_SID = "7e57ca4d00000012"; // text-only, ellsworth — no offer card
const CTA_SID = "7e57ca4d00000013"; // cta, ellsworth — no offer card

const EXPECT_HREF = (sid: string) => `https://links.papex.app/rdh?sid=${sid}`;
// links.papex.app/rdh?sid= is ALSO the pre-existing "Save to PapeX" iOS CTA's
// own href (lib/storeLinks.ts rdhUniversalLink, rendered by CtaRow's
// SaveToPapex on every non-demo sid page) — that's deliberate (same proven
// hand-off), so presence of the URL alone doesn't prove THIS link exists.
// Assert on the link text, which only this module renders.
const receiptUrl = (sid: string) => `${RDH}/receipt/${sid}`;
const parsedUrl = (sid: string) => `${RDH}/receipt/${sid}/parsed`;
const cardsBody = (body: string, delayMs?: number) => ({
  status: 200,
  body,
  contentType: "application/json",
  delayMs,
});

function withEnv(value: string | undefined, fn: () => Promise<void> | void) {
  const saved = process.env.OFFER_SAVE_LINK;
  if (value === undefined) delete process.env.OFFER_SAVE_LINK;
  else process.env.OFFER_SAVE_LINK = value;
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      if (saved === undefined) delete process.env.OFFER_SAVE_LINK;
      else process.env.OFFER_SAVE_LINK = saved;
    });
}

async function renderSid(
  sid: string,
  template: "hartwells" | "ellsworth",
  cardsAnswer: { status: number; body: string; contentType: string; delayMs?: number } | undefined,
  ua: string = IPHONE_UA,
) {
  testRequest.userAgent = ua;
  const blob = template === "hartwells" ? HARTWELLS_BLOB : ELLSWORTH_BLOB;
  setUpstreams({
    [receiptUrl(sid)]: bytes(blob.bytes),
    [parsedUrl(sid)]: status(404),
    ...(cardsAnswer ? { [webCardsUrl(sid)]: cardsAnswer } : {}),
  });
  const el = await ReceiptPage({ searchParams: Promise.resolve({ sid }) });
  return renderHtml(el);
}

/** The exact markup the stack for `body` renders as, at the page clock — no save link (flag off / non-iOS shape). */
async function expectedStackNoSaveLink(body: string, sid: string, entering: boolean): Promise<string> {
  const now = new Date(testClock.nowMs);
  const cards = restrictToWebCaps(parseCardsResponse(body, sid, { now }));
  return renderHtml(<WebCardStack cards={cards} now={now} entering={entering} />);
}

async function main() {
  // ---- flag off: byte-identical to receiptPage.cards.test.tsx's own shape --------

  await test("flag unset (default): an offer-card sid page renders the stack exactly as before this feature existed", async () => {
    await withEnv(undefined, async () => {
      const body = readVariant("rf-offer-code128.json");
      const html = await renderSid(OFFER_SID_RECEIPT_FIRST, "hartwells", cardsBody(body));
      const stack = await expectedStackNoSaveLink(body, OFFER_SID_RECEIPT_FIRST, false);
      assert.ok(html.includes(stack), "stack markup unchanged");
      assert.ok(!html.includes(LINK_TEXT));
    });
  });

  await test('OFFER_SAVE_LINK set to anything but "1" stays OFF (fails closed)', async () => {
    for (const v of ["true", "yes", "0", ""]) {
      await withEnv(v, async () => {
        const html = await renderSid(OFFER_SID_RECEIPT_FIRST, "hartwells", cardsBody(readVariant("rf-offer-code128.json")));
        assert.ok(!html.includes(LINK_TEXT), `expected off for OFFER_SAVE_LINK="${v}"`);
      });
    }
  });

  // ---- flag on + iOS + an offer card: the link appears, inline, both layouts -----

  await test("flag on + iPhone: receipt-first offer, cards settle inline — link present after the stack", async () => {
    await withEnv("1", async () => {
      const html = await renderSid(OFFER_SID_RECEIPT_FIRST, "hartwells", cardsBody(readVariant("rf-offer-code128.json")));
      assert.ok(html.includes(LINK_TEXT), "link text missing");
      assert.ok(html.includes(`href="${EXPECT_HREF(OFFER_SID_RECEIPT_FIRST)}"`), html);
      const stackEnd = html.indexOf("</svg>"); // the offer's barcode, inside the stack
      const linkAt = html.indexOf(LINK_TEXT);
      const ctaAt = html.indexOf("Save to PapeX");
      assert.ok(stackEnd >= 0 && stackEnd < linkAt, "link comes after the card content");
      assert.ok(linkAt < ctaAt, "link is with the cards, above the CtaRow's own Save to PapeX");
    });
  });

  await test("flag on + iPhone: cards-first offer, cards settle inline — link present", async () => {
    await withEnv("1", async () => {
      const html = await renderSid(OFFER_SID_CARDS_FIRST, "hartwells", cardsBody(readVariant("cf-offer-code128.json")));
      assert.ok(html.includes(LINK_TEXT));
      assert.ok(html.includes(`href="${EXPECT_HREF(OFFER_SID_CARDS_FIRST)}"`));
    });
  });

  await test("flag on + iPhone: offer arrives AFTER the receipt (streamed) — link present in the filled slot", async () => {
    await withEnv("1", async () => {
      const html = await renderSid(
        OFFER_SID_RECEIPT_FIRST,
        "hartwells",
        cardsBody(readVariant("rf-offer-code128.json"), 30),
      );
      assert.ok(html.includes(LINK_TEXT));
      assert.ok(html.includes(`href="${EXPECT_HREF(OFFER_SID_RECEIPT_FIRST)}"`));
    });
  });

  // ---- flag on + iOS, but nothing to save --------------------------------------

  await test("flag on + iPhone: text-only cards (no offer) — link absent", async () => {
    await withEnv("1", async () => {
      const html = await renderSid(TEXT_ONLY_SID, "ellsworth", cardsBody(readVariant("text-only.json")));
      assert.ok(!html.includes(LINK_TEXT), "a text card has nothing for the app's Save button to act on");
    });
  });

  await test("flag on + iPhone: cta-only cards (no offer) — link absent", async () => {
    await withEnv("1", async () => {
      const html = await renderSid(CTA_SID, "ellsworth", cardsBody(readVariant("cta.json")));
      assert.ok(!html.includes(LINK_TEXT));
    });
  });

  await test("flag on + iPhone: cards service down (no cards at all) — link absent", async () => {
    await withEnv("1", async () => {
      const html = await renderSid(OFFER_SID_RECEIPT_FIRST, "hartwells", { status: 404, body: "", contentType: "application/json" });
      assert.ok(!html.includes(LINK_TEXT));
    });
  });

  // ---- flag on, wrong platform --------------------------------------------------

  await test("flag on + Android: absent even with a real offer card", async () => {
    await withEnv("1", async () => {
      const html = await renderSid(
        OFFER_SID_RECEIPT_FIRST,
        "hartwells",
        cardsBody(readVariant("rf-offer-code128.json")),
        ANDROID_UA,
      );
      assert.ok(!html.includes(LINK_TEXT));
    });
  });

  await test("flag on + desktop: absent", async () => {
    await withEnv("1", async () => {
      const html = await renderSid(
        OFFER_SID_RECEIPT_FIRST,
        "hartwells",
        cardsBody(readVariant("rf-offer-code128.json")),
        DESKTOP_UA,
      );
      assert.ok(!html.includes(LINK_TEXT));
    });
  });

  finish();
}

main();
