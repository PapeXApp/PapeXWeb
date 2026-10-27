// app/r/pos.test.tsx
//
// POS-fed receipts (KORONA via papex-adapter-backend) on the web. Standalone
// tsx script:
//   npm run test:pos
//
// Three surfaces, all with fetch routed by ./testPageHarness:
//   1. /r/<merchant>/<register> — the RDS sticker tap: one sale redirects to
//      /r?sid=, several render a picker, no_recent_sale / unknown_register
//      render their own screens, an adapter failure renders a retry.
//   2. /api/r/<sid>/parsed — on an RDH 404, the adapter's POS body comes back.
//   3. /r?sid=<pos sid> — no bytes exist (RDH 404s the byte fetch), and the
//      receipt renders from the POS /parsed body alone.
// Contract: papex-adapter-backend docs/POS_RECEIPT_DELIVERY.md.

import assert from "node:assert/strict";
import { FIXED_NOW_MS, finish, test, RDH, json, status, calls, redirectTarget, renderHtml, setUpstreams, HANG } from "./testPageHarness";
import { runScenario } from "./testRunScenario";
import StickerTapPage from "./[merchant]/[register]/page";
import { GET as parsedProxy } from "@/app/api/r/[sid]/parsed/route";
import type { ReactNode } from "react";

const ADAPTER = "https://adapter.api.papex.app";
const SID = "a1b2c3d4e5f60718";
const SID2 = "0f1e2d3c4b5a6978";
const RDS = `${ADAPTER}/api/v1/pos/rds/papex-cafe/register-2`;
const POS_PARSED = (sid: string) => `${ADAPTER}/api/v1/pos/receipt/${sid}/parsed`;

const iso = (msAgo: number) => new Date(FIXED_NOW_MS - msAgo).toISOString();
const candidate = (sid: string, total: number, msAgo: number, isRefund = false) => ({
  sid,
  total,
  currency: "USD",
  time: iso(msAgo),
  isRefund,
});

// The adapter's toParsedResponse for a two-line KORONA sale. `price` is the
// UNIT price there and `total` the line amount.
const POS_BODY = {
  sid: SID,
  parseStatus: "ok",
  hasImage: false,
  uploadedAt: iso(30_000),
  source: "pos",
  receipt: {
    merchantName: "PapeX Cafe — Main St",
    merchantAddress: null,
    date: "2026-10-01",
    time: "09:59",
    currency: "USD",
    subtotal: 10.0,
    tax: 0.8,
    total: 10.8,
    lineItems: [
      { name: "Oat Latte", quantity: 2, price: 3.5, total: 7.0, sku: "1001" },
      { name: "Croissant", quantity: 1, price: 3.0, total: 3.0, sku: "2002" },
    ],
    paymentMethod: "VISA",
    receiptNumber: "T-9001",
    receiptType: null,
    confidence: 1,
    extractorEngine: "pos:korona",
  },
};

const text = (html: string) =>
  html.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");

async function tap(merchant: string, register: string): Promise<{ html: string; redirect: string | null; urls: string[] }> {
  try {
    const el = (await StickerTapPage({ params: Promise.resolve({ merchant, register }) })) as ReactNode;
    return { html: await renderHtml(el), redirect: null, urls: calls.map((c) => c.url) };
  } catch (err) {
    const target = redirectTarget(err);
    if (target == null) throw err;
    return { html: "", redirect: target, urls: calls.map((c) => c.url) };
  }
}

async function main() {
  // ---- 1. sticker taps ------------------------------------------------------------

  await test("sticker: one recent sale redirects to /r?sid=", async () => {
    const one = candidate(SID, 10.8, 20_000);
    setUpstreams({ [RDS]: json(200, { ...one, candidates: [one] }) });
    const r = await tap("papex-cafe", "register-2");
    assert.equal(r.redirect, `/r?sid=${SID}`);
    assert.deepEqual(r.urls, [RDS]);
  });

  await test("sticker: several recent sales render a picker linking each sid", async () => {
    const newest = candidate(SID, 10.8, 20_000);
    const older = candidate(SID2, 4.25, 95_000, true);
    setUpstreams({ [RDS]: json(200, { ...newest, candidates: [newest, older] }) });
    const r = await tap("papex-cafe", "register-2");
    assert.equal(r.redirect, null);
    const t = text(r.html);
    assert.ok(t.includes("Which one is yours?"));
    assert.ok(t.includes("$10.80") && t.includes("Just now"), t);
    assert.ok(t.includes("$4.25") && t.includes("Refund") && t.includes("1 min ago"), t);
    assert.ok(r.html.includes(`href="/r?sid=${SID}"`));
    assert.ok(r.html.includes(`href="/r?sid=${SID2}"`));
  });

  await test("sticker: malformed candidates are dropped, never linked", async () => {
    const good = candidate(SID, 10.8, 20_000);
    setUpstreams({ [RDS]: json(200, { ...good, candidates: [good, { sid: "NOT-A-SID", total: 1 }] }) });
    const r = await tap("papex-cafe", "register-2");
    assert.equal(r.redirect, `/r?sid=${SID}`, "one valid candidate left: straight to it");
  });

  await test("sticker: no_recent_sale says to tap again after paying", async () => {
    setUpstreams({ [RDS]: json(404, { error: "no_recent_sale" }) });
    const t = text((await tap("papex-cafe", "register-2")).html);
    assert.ok(t.includes("No receipt yet"));
    assert.ok(t.includes("Tap the sticker again right after you pay"));
  });

  await test("sticker: unknown_register says the sticker isn't set up", async () => {
    setUpstreams({ [RDS]: json(404, { error: "unknown_register" }) });
    const t = text((await tap("papex-cafe", "register-2")).html);
    assert.ok(t.includes("This sticker isn't set up yet"));
  });

  await test("sticker: bad slugs and the reserved `demo` never reach the adapter", async () => {
    for (const [m, r] of [["Papex-Cafe", "register-2"], ["papex-cafe", "reg_2"], ["demo", "register-2"], ["a".repeat(65), "r"]]) {
      setUpstreams({});
      const res = await tap(m, r);
      assert.deepEqual(res.urls, [], `${m}/${r} called upstream`);
      assert.ok(text(res.html).includes("This sticker isn't set up yet"));
    }
  });

  await test("sticker: an adapter failure or timeout renders a retry, never a receipt", async () => {
    for (const up of [status(500), json(404, { error: "something_else" }), json(200, { candidates: [] })]) {
      setUpstreams({ [RDS]: up });
      const t = text((await tap("papex-cafe", "register-2")).html);
      assert.ok(t.includes("Couldn't load your receipt"), t);
    }
  });

  await test("sticker: never cached", async () => {
    let seen: RequestInit | undefined;
    const real = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      seen = init;
      return real(input, init);
    }) as typeof fetch;
    try {
      const one = candidate(SID, 10.8, 20_000);
      setUpstreams({ [RDS]: json(200, { ...one, candidates: [one] }) });
      await tap("papex-cafe", "register-2");
    } finally {
      globalThis.fetch = real;
    }
    assert.equal(seen?.cache, "no-store");
  });

  // ---- 2. the /parsed proxy ----------------------------------------------------------

  const proxy = async (sid: string) => {
    const res = await parsedProxy(new Request(`http://localhost/api/r/${sid}/parsed`), { params: Promise.resolve({ sid }) });
    return { status: res.status, body: await res.json(), cache: res.headers.get("cache-control") };
  };

  await test("proxy: an RDH 404 falls back to the adapter's POS body", async () => {
    setUpstreams({ [`${RDH}/receipt/${SID}/parsed`]: status(404), [POS_PARSED(SID)]: json(200, POS_BODY) });
    const r = await proxy(SID);
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, POS_BODY);
    assert.equal(r.cache, "private, no-store, max-age=0");
    assert.deepEqual(calls.map((c) => c.url), [`${RDH}/receipt/${SID}/parsed`, POS_PARSED(SID)]);
  });

  await test("proxy: an RDH receipt never asks the adapter", async () => {
    const rdhBody = { sid: SID, parseStatus: "ok_raster", hasImage: true, uploadedAt: null, receipt: null };
    setUpstreams({ [`${RDH}/receipt/${SID}/parsed`]: json(200, rdhBody) });
    const r = await proxy(SID);
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, rdhBody);
    assert.deepEqual(calls.map((c) => c.url), [`${RDH}/receipt/${SID}/parsed`]);
  });

  await test("proxy: unknown in both is a 404; an RDH error is a 502 and is NOT retried", async () => {
    setUpstreams({ [`${RDH}/receipt/${SID}/parsed`]: status(404), [POS_PARSED(SID)]: json(404, { error: "not_found" }) });
    assert.equal((await proxy(SID)).status, 404);

    setUpstreams({ [`${RDH}/receipt/${SID}/parsed`]: status(503), [POS_PARSED(SID)]: json(200, POS_BODY) });
    assert.equal((await proxy(SID)).status, 502);
    assert.deepEqual(calls.map((c) => c.url), [`${RDH}/receipt/${SID}/parsed`]);

    setUpstreams({ [`${RDH}/receipt/${SID}/parsed`]: status(404), [POS_PARSED(SID)]: status(500) });
    assert.equal((await proxy(SID)).status, 502);
  });

  // ---- 3. /r?sid= for a POS sid -----------------------------------------------------------

  const posScenario = (posParsed: ReturnType<typeof json>) => ({
    name: "pos",
    route: "/r" as const,
    params: { sid: SID },
    upstreams: {
      [`${RDH}/receipt/${SID}`]: status(404),
      [`${RDH}/receipt/${SID}/parsed`]: status(404),
      [POS_PARSED(SID)]: posParsed,
    },
  });

  await test("/r: a POS sid renders from the adapter's /parsed, with no bytes", async () => {
    const { html, urls } = await runScenario(posScenario(json(200, POS_BODY)));
    const t = text(html);
    for (const s of ["PapeX Cafe — Main St", "Oat Latte", "Croissant", "$7.00", "$3.00", "$10.80", "2026-10-01 09:59", "Save to PapeX"]) {
      assert.ok(t.includes(s), `missing ${JSON.stringify(s)}`);
    }
    assert.ok(!t.includes("$3.50"), "a line shows its total, never the unit price");
    assert.ok(!t.includes("Refund"), "a sale is not labelled a refund");
    assert.ok(!t.includes("Receipt not available"));
    assert.ok(!t.includes("Original receipt"), "no ESC/POS body or image collapsible");
    assert.ok(urls.includes(POS_PARSED(SID)));
  });

  await test("/r: a POS refund is labelled Refund", async () => {
    const refund = structuredClone(POS_BODY);
    refund.receipt.receiptType = "refund" as unknown as null;
    const t = text((await runScenario(posScenario(json(200, refund)))).html);
    assert.ok(t.includes("Refund"));
  });

  await test("/r: an unknown sid is still Receipt not available", async () => {
    const t = text((await runScenario(posScenario(json(404, { error: "not_found" })))).html);
    assert.ok(t.includes("Receipt not available"), t);
  });

  await test("/r: a non-POS or empty body never stands in for missing bytes", async () => {
    const notPos = { ...POS_BODY, source: undefined };
    const empty = { ...POS_BODY, receipt: { ...POS_BODY.receipt, merchantName: null, total: null, lineItems: [] } };
    for (const body of [notPos, empty]) {
      const t = text((await runScenario(posScenario(json(200, body)))).html);
      assert.ok(t.includes("Receipt not available"), t);
    }
  });

  await test("/r: an adapter that hangs still ends in a page (no receipt invented)", async () => {
    const t = text((await runScenario(posScenario(HANG))).html);
    assert.ok(t.includes("Receipt not available"), t);
  });

  finish();
}

main();
