// app/r/sharedReceiptPhoto.test.tsx
//
// 1.7.2 #30: the receipt PHOTO on `/r?rid=`. Standalone tsx script (see
// package.json):
//   npm run test:sharedReceiptPhoto
//
// Drives the real page component through ./testPageHarness.tsx, like
// ./ridSaveLink.test.tsx and ./receiptPage.parity.test.tsx.
//
// What this proves:
//   - The function offers a photo -> the page carries ONE <img> whose src is
//     the function's own `&photo=1` URL, with no Storage URL or token in the
//     HTML, and the page is otherwise EXACTLY the text-only page (removing the
//     photo section and React's hoisted image-preload hint gives back the page
//     rendered without a photo).
//   - No `photo` key (the function as it is today) -> the page is
//     byte-identical to the text-only page: this build may ship before the
//     function does.
//   - `photo: null` / `{available: false}` -> likewise.
//   - An unreadable receipt with a photo -> the photo IS the receipt
//     ("Shared receipt"), not "Receipt not available"; without one, as before.
//   - A 404 / error from the function never shows a photo.
//   - The page never fetches the photo itself: the browser does.
//   - The section is a pure function of the image's state: it renders nothing
//     when the image failed, so the page falls back to text only.

import assert from "node:assert/strict";
import {
  SHARED,
  finish,
  json,
  renderHtml,
  setUpstreams,
  status,
  calls,
  test,
  testRequest,
  ANDROID_UA,
  IPHONE_UA,
} from "./testPageHarness";
import ReceiptPage from "./page";
import { PhotoSectionView, statusOfImage } from "./SharedReceiptPhoto";

const RID = "receipt_1776344585632_4mrd9txmk";
const PHOTO_URL_ATTR = `${SHARED}/sharedReceipt?rid=${RID}&amp;photo=1`;

const TEXT_ONLY = {
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
const EMPTY_RECEIPT = { ...TEXT_ONLY.receipt, merchantName: null, total: null, lineItems: [] };

async function render(body: unknown, ua: string = IPHONE_UA, httpStatus = 200) {
  testRequest.userAgent = ua;
  setUpstreams({ [`${SHARED}/sharedReceipt?rid=${RID}`]: httpStatus === 200 ? json(200, body) : status(httpStatus) });
  const el = await ReceiptPage({ searchParams: Promise.resolve({ rid: RID }) });
  return renderHtml(el);
}

const SECTION = /<div class="mt-4"><section aria-label="Photo of the receipt">[\s\S]*?<\/section><\/div>/;
// React 19 hoists a preload hint for an <img> into the document, ahead of <main>.
const PRELOAD = /<link rel="preload" as="image" href="[^"]*photo=1"[^>]*\/>/;
const photoImgs = (html: string) => (html.match(/<img [^>]*photo=1[^>]*>/g) ?? []).length;
const WITH_PHOTO = { ...TEXT_ONLY, photo: { available: true } };

async function main() {
  await test("a photo is offered: one <img> pointing at the function's &photo=1, no Storage URL or token", async () => {
    const html = await render(WITH_PHOTO);
    assert.equal(photoImgs(html), 1);
    assert.ok(html.includes(`src="${PHOTO_URL_ATTR}"`), "img src is the function's photo URL");
    assert.ok(html.includes('alt="Photo of the shared receipt"'));
    assert.ok(html.includes("Receipt photo"), "the section title");
    assert.ok(html.includes('referrerPolicy="no-referrer"') || html.includes('referrerpolicy="no-referrer"'));
    for (const leak of ["firebasestorage", "token=", "googleapis.com/v0", "storage.googleapis"]) {
      assert.equal(html.includes(leak), false, `leaked ${leak}`);
    }
    // POSITIVE CONTROL: the receipt text is still there.
    assert.ok(html.includes("CASH RECEIPT"));
  });

  await test("the photo page is EXACTLY the text-only page plus the photo section", async () => {
    const textOnly = await render(TEXT_ONLY);
    const withPhoto = await render(WITH_PHOTO);
    assert.notEqual(withPhoto, textOnly);
    assert.ok(SECTION.test(withPhoto), "the section is where the test expects it");
    assert.ok(PRELOAD.test(withPhoto), "React hoists the image preload hint");
    assert.equal(withPhoto.replace(SECTION, "").replace(PRELOAD, ""), textOnly);
  });

  await test("no `photo` key (the function before #30): byte-identical text-only page, no photo <img>", async () => {
    const html = await render(TEXT_ONLY);
    assert.equal(photoImgs(html), 0);
    assert.equal(html.includes("Receipt photo"), false);
    assert.ok(html.includes("CASH RECEIPT"));
  });

  await test("photo null / unavailable / junk: identical to the text-only page", async () => {
    const textOnly = await render(TEXT_ONLY);
    for (const photo of [null, { available: false }, {}, "x", 1, [{ available: true }]]) {
      assert.equal(await render({ ...TEXT_ONLY, photo }), textOnly, JSON.stringify(photo));
    }
  });

  await test("hasImage:true alone does not show a photo (that flag is the App Clip's)", async () => {
    assert.equal(await render({ ...TEXT_ONLY, hasImage: true }), await render(TEXT_ONLY));
  });

  await test("same on Android: the photo is the same section", async () => {
    const html = await render(WITH_PHOTO, ANDROID_UA);
    assert.equal(photoImgs(html), 1);
  });

  await test("an unreadable receipt WITH a photo shows the photo as the receipt", async () => {
    const html = await render({ ...WITH_PHOTO, receipt: EMPTY_RECEIPT });
    assert.equal(photoImgs(html), 1);
    assert.ok(html.includes("Shared receipt"));
    assert.equal(html.includes("Receipt not available"), false);
  });

  await test("an unreadable receipt WITHOUT a photo is 'not available', as before", async () => {
    const html = await render({ ...TEXT_ONLY, receipt: EMPTY_RECEIPT });
    assert.equal(photoImgs(html), 0);
    assert.ok(html.includes("Receipt not available") || html.includes("not available"));
  });

  await test("a 404 or an error from the function never shows a photo", async () => {
    for (const code of [404, 500]) {
      const html = await render(WITH_PHOTO, IPHONE_UA, code);
      assert.equal(photoImgs(html), 0, `status ${code}`);
    }
  });

  await test("the page itself never fetches the photo; the browser does", async () => {
    await render(WITH_PHOTO);
    assert.deepEqual(
      calls.map((c) => c.url),
      [`${SHARED}/sharedReceipt?rid=${RID}`],
    );
  });

  await test("PhotoSectionView: failed -> renders NOTHING (the page falls back to text only); loading and loaded render the image", async () => {
    const view = (st: "loading" | "loaded" | "failed") =>
      renderHtml(<PhotoSectionView src={`${SHARED}/x?photo=1`} title="Receipt photo" status={st} />);
    assert.equal(await view("failed"), "");
    const loading = await view("loading");
    const loaded = await view("loaded");
    for (const html of [loading, loaded]) assert.ok(/<img /.test(html));
    assert.ok(loading.includes("min-height:140px"), "a placeholder height while loading");
    assert.equal(loaded.includes("min-height"), false);
  });

  await test("statusOfImage: the element's own state, including an image that settled before hydration", () => {
    assert.equal(statusOfImage(null), "loading");
    assert.equal(statusOfImage(undefined), "loading");
    assert.equal(statusOfImage({ complete: false, naturalWidth: 0 }), "loading");
    assert.equal(statusOfImage({ complete: true, naturalWidth: 640 }), "loaded");
    assert.equal(statusOfImage({ complete: true, naturalWidth: 0 }), "failed");
  });

  finish();
}

void main();
