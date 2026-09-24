// app/r/receiptPage.cards.test.tsx
//
// Production `/r` with server-resolved receipt cards (surface=web). Runs the
// real page component (see ./testPageHarness.tsx). Standalone tsx script:
//   npm run test:rCards
//
// What it proves:
//   - NO CARDS = TODAY'S PAGE. Every way the cards call can fail (404, 5xx,
//     none, degraded, not JSON, oversize, a sid mismatch, every card dropped,
//     arriving late with nothing, a full 2.5 s timeout) renders the parity
//     goldens of ./receiptPage.parity.test.tsx: byte-identical when the call
//     has settled by the time the receipt is ready; identical once React's
//     empty Suspense-boundary comments are removed when it has not (those
//     comments are the only difference, and they render nothing).
//   - EVERY surface=web FIXTURE in contracts/cards/v1/fixtures/variants renders
//     its INDEX.json card ids, in order, above the receipt for cards-first and
//     between the receipt and the CTA row for receipt-first, both when the
//     cards beat the receipt (inline) and when they stream in after it.
//   - The hostile fixture renders only its two survivors.
//   - Offers: barcode and code redemption, the licence line, the savings
//     headline, hideWhenExpired at the render clock; no Save action on web
//     while the "Save to PapeX" receipt CTA stays.
//   - THE RECEIPT NEVER WAITS FOR CARDS, structurally (source) and
//     behaviourally: the page component returns, and the shell with the
//     receipt streams, while the cards request is still in flight.
//   - Cards are server components, fetchCards is server-only, and nothing
//     here uses dangerouslySetInnerHTML.

import {
  HANG,
  RDH,
  finish,
  renderHtml,
  renderStream,
  setUpstreams,
  test,
  testClock,
  FIXED_NOW_MS,
  calls,
  type Upstream,
} from "./testPageHarness";
import { runScenario } from "./testRunScenario";
import ReceiptPage from "./page";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { HARTWELLS_BLOB, ELLSWORTH_BLOB } from "@/lib/__fixtures__/demoBlobs";
import { parseCardsResponse } from "@/lib/cards/normalize";
import { restrictToWebCaps, webCardsUrl } from "@/lib/cards/fetchCards";
import { WebCardStack } from "./cards/WebCards";
import { SCENARIOS, type Scenario } from "./testParityScenarios";

const ROOT = resolve(__dirname, "../..");
const VARIANTS = join(ROOT, "contracts/cards/v1/fixtures/variants");
const PARITY = join(__dirname, "__parity__");
const readVariant = (f: string) => readFileSync(join(VARIANTS, f), "utf8");
const GOLDEN = JSON.parse(readFileSync(join(PARITY, "INDEX.json"), "utf8")) as {
  scenarios: Record<string, { sha256: string }>;
};
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const golden = (name: string) => readFileSync(join(PARITY, `${name}.html`), "utf8");

/** React's completed-boundary markers around an EMPTY Suspense slot. */
const EMPTY_BOUNDARY = /<!--\$--><!--\/\$-->/g;

interface IndexVariant {
  sid: string;
  variant: string;
  template: "hartwells" | "ellsworth";
  layout: "receipt-first" | "cards-first";
  responses: Record<string, string>;
  expectCardIds: Record<string, string[]>;
}
const INDEX = JSON.parse(readVariant("INDEX.json")) as {
  variants: IndexVariant[];
  clientOnly: { file: string; requestSid: string; expectCardIds: string[] }[];
};

const receiptUrl = (sid: string) => `${RDH}/receipt/${sid}`;
const parsedUrl = (sid: string) => `${RDH}/receipt/${sid}/parsed`;
const cardsBody = (body: string, delayMs?: number): Upstream => ({ status: 200, body, contentType: "application/json", delayMs });

/** A text-receipt page for `sid` (receipt bytes from the variant's template), cards answered by `cards`. */
function pageFor(sid: string, template: "hartwells" | "ellsworth"): Scenario {
  return {
    name: `variant-${sid}`,
    route: "/r",
    params: { sid },
    upstreams: {
      [receiptUrl(sid)]: { status: 200, body: (template === "hartwells" ? HARTWELLS_BLOB : ELLSWORTH_BLOB).bytes },
      [parsedUrl(sid)]: { status: 404, body: "" },
    },
    cardsSid: sid,
    receiptRenders: true,
  };
}

/** The exact markup the stack for `body` must render as, at the page clock. */
async function expectedStack(body: string, sid: string, entering: boolean): Promise<string> {
  const now = new Date(testClock.nowMs);
  const cards = restrictToWebCaps(parseCardsResponse(body, sid, { now }));
  return renderHtml(<WebCardStack cards={cards} now={now} entering={entering} />);
}

/** Where things are in a rendered /r page. */
function positions(html: string, stack: string, merchantMarker: string) {
  return {
    stack: html.indexOf(stack),
    receipt: html.indexOf(merchantMarker),
    cta: html.search(/Save to PapeX/),
  };
}

async function main() {
  // ===========================================================================
  // No cards: today's page
  // ===========================================================================

  const allDropped = JSON.stringify({
    schemaVersion: 1,
    sid: "__SID__",
    status: "ok",
    merchant: { partner: false, ageRestricted: true },
    layout: { order: "cards-first" },
    cards: [{ id: "no-licence", mode: "live", type: "offer", valueLabel: "$5", title: "Five off" }, { id: "x", type: "loyaltyV9" }],
  });
  const noCardAnswers: [string, (sid: string) => Upstream][] = [
    ["404 (not deployed)", () => ({ status: 404, body: "" })],
    ["503", () => ({ status: 503, body: "Service Unavailable" })],
    ["status none", (sid) => cardsBody(readVariant("status-none.json").replace("7e57ca4d00000017", sid))],
    ["status degraded", (sid) => cardsBody(readVariant("status-degraded.json").replace("7e57ca4d00000018", sid))],
    ["not JSON", () => cardsBody("<html>502 Bad Gateway</html>")],
    ["oversize", (sid) => cardsBody(readVariant("rf-offer-code128.json").replace("7e57ca4d00000001", sid) + " ".repeat(33_000))],
    ["sid mismatch", () => cardsBody(readVariant("rf-offer-code128.json"))],
    ["every card dropped", (sid) => cardsBody(allDropped.replace("__SID__", sid))],
  ];
  const receiptScenarios = SCENARIOS.filter((s) => s.cardsSid && s.receiptRenders);
  const noReceiptScenarios = SCENARIOS.filter((s) => s.cardsSid && !s.receiptRenders);
  const neverScenarios = SCENARIOS.filter((s) => !s.cardsSid);

  for (const s of receiptScenarios) {
    for (const [what, answer] of noCardAnswers) {
      await test(`${s.name}, cards ${what}: byte-identical to today's page`, async () => {
        const r = await runScenario(s, { [webCardsUrl(s.cardsSid!)]: answer(s.cardsSid!) });
        assert.equal(sha(r.html), GOLDEN.scenarios[s.name].sha256);
        assert.equal(r.urls.filter((u) => u.includes("/cards?")).length, 1, "exactly one cards request");
      });
    }
    await test(`${s.name}, cards arrive AFTER the receipt with nothing: today's page (+ empty boundary comments only)`, async () => {
      const late = cardsBody(readVariant("status-none.json").replace("7e57ca4d00000017", s.cardsSid!), 40);
      const r = await runScenario(s, { [webCardsUrl(s.cardsSid!)]: late });
      assert.equal((r.html.match(EMPTY_BOUNDARY) ?? []).length, 2, "two empty slots took the streamed path");
      assert.equal(r.html.replace(EMPTY_BOUNDARY, ""), golden(s.name));
    });
  }

  await test("sid-text, cards call hangs: the 2.5 s budget ends it and the page is today's (+ empty boundary comments only)", async () => {
    const s = SCENARIOS.find((x) => x.name === "sid-text")!;
    const t0 = performance.now();
    const r = await runScenario(s, { [webCardsUrl(s.cardsSid!)]: HANG });
    const took = performance.now() - t0;
    assert.ok(took >= 2400 && took < 4000, `the stream closed after ${Math.round(took)} ms`);
    assert.equal(r.html.replace(EMPTY_BOUNDARY, ""), golden(s.name));
  });

  for (const s of noReceiptScenarios) {
    await test(`${s.name}: valid cards never render without a receipt`, async () => {
      const body = readVariant("four-cards.json").replace("7e57ca4d00000014", s.cardsSid!);
      const r = await runScenario(s, { [webCardsUrl(s.cardsSid!)]: cardsBody(body) });
      assert.equal(sha(r.html), GOLDEN.scenarios[s.name].sha256);
    });
  }

  for (const s of neverScenarios) {
    await test(`${s.name}: never calls /cards, even with cards on offer; today's page`, async () => {
      const sid = s.params.sid ?? "5ca1e00000000001";
      const r = await runScenario(s, { [webCardsUrl(sid)]: cardsBody(readVariant("four-cards.json").replace("7e57ca4d00000014", sid)) });
      assert.deepEqual(r.urls.filter((u) => u.includes("/cards")), []);
      assert.equal(sha(r.html), GOLDEN.scenarios[s.name].sha256);
    });
  }

  // ===========================================================================
  // Every surface=web fixture
  // ===========================================================================

  for (const v of INDEX.variants) {
    for (const path of ["inline", "streamed"] as const) {
      await test(`variant ${v.sid} ${v.variant} (${path}): ${JSON.stringify(v.expectCardIds.web)} ${v.expectCardIds.web.length ? v.layout : ""}`, async () => {
        const body = readVariant(v.responses.web);
        const s = pageFor(v.sid, v.template);
        const r = await runScenario(s, { [webCardsUrl(v.sid)]: cardsBody(body, path === "streamed" ? 30 : undefined) });
        const ids = restrictToWebCaps(parseCardsResponse(body, v.sid, { now: new Date(testClock.nowMs) })).cards.map((c) => c.id);
        assert.deepEqual(ids, v.expectCardIds.web, "decoded ids");
        const merchant = v.template === "hartwells" ? "HARTWELL&#x27;S MARKET" : "ELLSWORTH";
        if (ids.length === 0) {
          const html = path === "streamed" ? r.html.replace(EMPTY_BOUNDARY, "") : r.html;
          assert.ok(!html.includes("<!--$-->"), "no leftover boundary");
          assert.ok(html.includes(merchant) && /Save to PapeX/.test(html));
          return;
        }
        const stack = await expectedStack(body, v.sid, path === "streamed");
        const p = positions(r.html, stack, merchant);
        assert.ok(p.stack >= 0, "the page contains exactly the expected card stack");
        assert.ok(p.receipt >= 0 && p.cta >= 0);
        if (v.layout === "cards-first") assert.ok(p.stack < p.receipt, "cards-first: above the receipt");
        else assert.ok(p.receipt < p.stack && p.stack < p.cta, "receipt-first: below the receipt, before the CTA row");
        assert.equal(r.html.split(stack).length, 2, "drawn once");
      });
    }
  }

  await test("hostile.json on /r: only ok-offer and papex-text render; no hostile string reaches the page", async () => {
    const c = INDEX.clientOnly.find((x) => x.file === "hostile.json")!;
    const body = readVariant(c.file);
    const r = await runScenario(pageFor(c.requestSid, "hartwells"), { [webCardsUrl(c.requestSid)]: cardsBody(body) });
    const stack = await expectedStack(body, c.requestSid, false);
    assert.ok(r.html.includes(stack));
    assert.deepEqual(restrictToWebCaps(parseCardsResponse(body, c.requestSid)).cards.map((x) => x.id), c.expectCardIds);
    assert.ok(!/javascript:/i.test(r.html), "javascript: URL");
    assert.ok(!/[‪-‮⁦-⁩]/.test(r.html), "bidi control");
  });

  // ===========================================================================
  // Offers, licence, savings, Save
  // ===========================================================================

  const variant = (name: string) => INDEX.variants.find((v) => v.variant === name)!;
  async function renderVariant(name: string, surfaceFile?: string) {
    const v = variant(name);
    const body = readVariant(surfaceFile ?? v.responses.web);
    return runScenario(pageFor(v.sid, v.template), { [webCardsUrl(v.sid)]: cardsBody(body) });
  }

  await test("code128 offer: a scannable SVG barcode with its human-readable text", async () => {
    const r = await renderVariant("rf-offer-code128");
    assert.match(r.html, /<svg[^>]*aria-label="Barcode [^"]+"/);
  });

  await test("UPC-A offer draws a barcode; a code offer draws the code, no barcode", async () => {
    assert.match((await renderVariant("offer-upca")).html, /aria-label="Barcode 042100005264"/);
    const code = await renderVariant("offer-text-code");
    assert.ok(!/aria-label="Barcode/.test(code.html));
    const card = JSON.parse(readVariant(variant("offer-text-code").responses.web)).cards[0];
    assert.ok(code.html.includes(card.redemption.code));
  });

  await test("QR offer (variant 0003) on /r: a server-drawn SVG QR code, no 1-D barcode", async () => {
    const r = await renderVariant("offer-qr");
    assert.match(r.html, /<svg[^>]*aria-label="QR code ELLS10OFF75"/);
    assert.ok(!/aria-label="Barcode/.test(r.html));
  });

  await test("licence line: drawn verbatim for the age-restricted merchant; absent for the control", async () => {
    const on = await renderVariant("offer-licence");
    const line = JSON.parse(readVariant(variant("offer-licence").responses.web)).cards[0].compliance.licenseLine;
    assert.ok(on.html.includes(line), line);
    const off = await renderVariant("offer-no-licence");
    assert.ok(!off.html.includes(line));
  });

  await test("savings headline: 'You saved $4.00 with a PapeX coupon'", async () => {
    assert.ok((await renderVariant("savings-on")).html.includes("You saved $4.00 with a PapeX coupon"));
    assert.ok(!(await renderVariant("savings-off")).html.includes("You saved"));
  });

  await test("hideWhenExpired: at the render clock past expiresAt the offer is not drawn", async () => {
    try {
      testClock.nowMs = Date.parse("2026-11-01T07:00:00Z");
      const late = await renderVariant("rf-offer-code128");
      assert.ok(!/aria-label="Barcode/.test(late.html), "offer hidden");
      assert.equal(late.html.replace(EMPTY_BOUNDARY, "").includes("<!--$"), false);
      testClock.nowMs = Date.parse("2026-11-01T06:59:59Z");
      const lastSecond = await renderVariant("rf-offer-code128");
      assert.ok(/aria-label="Barcode/.test(lastSecond.html), "offer still drawn at its last second");
      assert.ok(lastSecond.html.includes(">Last day<"), "with the Last day chip");
    } finally {
      testClock.nowMs = FIXED_NOW_MS;
    }
  });

  await test("no Save action on web (even if the server sent one); the Save to PapeX receipt CTA stays", async () => {
    const v = variant("rf-offer-code128");
    const appBody = readVariant(v.responses.app);
    assert.ok(JSON.parse(appBody).cards.some((c: { actions?: unknown[] }) => c.actions?.length), "the app fixture carries Save");
    // The inert Save line (OfferCard's InertSaveAction) is the only dashed-border element a card draws.
    const INERT_SAVE = /border:1px dashed/;
    const control = await renderHtml(
      <WebCardStack cards={parseCardsResponse(appBody, v.sid)} now={new Date(testClock.nowMs)} />,
    );
    assert.match(control, INERT_SAVE, "positive control: unfiltered, the Save line is drawn");
    const r = await runScenario(pageFor(v.sid, v.template), { [webCardsUrl(v.sid)]: cardsBody(appBody) });
    assert.ok(/aria-label="Barcode/.test(r.html), "the offer renders");
    assert.doesNotMatch(r.html, INERT_SAVE, "the Save line is not drawn on web");
    assert.equal(r.html.match(/Save to PapeX/g)?.length, (golden("sid-text").match(/Save to PapeX/g) ?? []).length, "receipt CTA unchanged");
  });

  await test("pending: its cards render; the web does not re-fetch (v1.1)", async () => {
    const r = await renderVariant("status-pending");
    assert.equal(r.urls.filter((u) => u.includes("/cards?")).length, 1);
    const card = JSON.parse(readVariant(variant("status-pending").responses.web)).cards[0];
    assert.ok(r.html.includes(card.body));
  });

  // ===========================================================================
  // The receipt never waits for cards
  // ===========================================================================

  await test("behaviour: the page returns, and the shell streams the receipt, while /cards is still in flight", async () => {
    const v = variant("cf-four-cards");
    const s = pageFor(v.sid, v.template);
    const body = readVariant(v.responses.web);
    setUpstreams({ ...s.upstreams, [webCardsUrl(v.sid)]: cardsBody(body, 400) });
    const t0 = performance.now();
    const el = await ReceiptPage({ searchParams: Promise.resolve({ sid: v.sid }) });
    const returnedAt = performance.now() - t0;
    assert.ok(returnedAt < 300, `page component returned after ${Math.round(returnedAt)} ms, before the 400 ms cards answer`);
    assert.ok(calls.some((c) => c.url.includes("/cards?")), "the cards request had already started");
    const chunks = await renderStream(el);
    const first = chunks[0];
    assert.ok(first.html.includes("ELLSWORTH"), "the first chunk carries the receipt");
    const cardText = JSON.parse(body).cards.find((c: { type: string }) => c.type === "text").body as string;
    assert.ok(!first.html.includes(cardText), "and no cards");
    assert.ok(first.at < 300, `shell flushed at ${Math.round(first.at)} ms`);
    const late = chunks.find((c) => c.html.includes(cardText));
    assert.ok(late && late.at >= 300, "the cards arrive in a later chunk");
    assert.ok(late.html.includes("$RC("), "and are swapped into their slot by React's boundary script");
  });

  await test("structure: page.tsx starts the cards task before the awaited reads and never awaits it", () => {
    const src = readFileSync(join(__dirname, "page.tsx"), "utf8").replace(/^\s*\/\/.*$/gm, "");
    const start = src.indexOf("startWebCards(");
    const all = src.indexOf("await Promise.all([fetchReceiptBytes(rawSid), fetchParsedReceipt(rawSid)])");
    assert.ok(start > 0 && all > start, "started before, and outside, the only Promise.all");
    for (const line of src.split("\n").filter((l) => /\bawait\b/.test(l))) {
      assert.ok(!/cards/i.test(line), `page.tsx awaits something cards-related: ${line.trim()}`);
    }
    const streamed = [...src.matchAll(/<StreamedCards\b/g)].map((m) => m.index!);
    assert.equal(streamed.length, 2);
    for (const at of streamed) {
      const before = src.slice(0, at);
      assert.ok(before.lastIndexOf("<Suspense fallback={null}>") > before.lastIndexOf("</Suspense>"), "each slot sits in its own Suspense boundary");
    }
    const webCards = readFileSync(join(__dirname, "cards/WebCards.tsx"), "utf8");
    assert.ok(!/startWebCards|fetchWebCards/.test(webCards.replace(/^\s*\/\/.*$/gm, "")), "the slot awaits the running request; it never starts one");
  });

  await test("cards are server components; fetchCards is server-only; no raw-HTML sink", () => {
    const files = [
      ...readdirSync(join(__dirname, "cards")).filter((f) => /\.tsx?$/.test(f)).map((f) => join(__dirname, "cards", f)),
      ...readdirSync(join(ROOT, "lib/cards")).filter((f) => /\.ts$/.test(f)).map((f) => join(ROOT, "lib/cards", f)),
      join(__dirname, "page.tsx"),
    ];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      if (!f.endsWith(".test.ts") && !f.endsWith(".test.tsx")) {
        assert.ok(!src.includes("dangerouslySetInnerHTML"), `${f}: dangerouslySetInnerHTML`);
      }
      assert.ok(!/^\s*["']use client["']/m.test(src), `${f} is a client module`);
    }
    // No client island may reach the cards client (it would ship the fetch, and the RDH API has no CORS).
    const clientFiles: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.name === "node_modules" || e.name.startsWith(".")) continue;
        const p = join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.tsx?$/.test(e.name) && /^\s*["']use client["']/m.test(readFileSync(p, "utf8"))) clientFiles.push(p);
      }
    };
    walk(join(ROOT, "app"));
    walk(join(ROOT, "components"));
    assert.ok(clientFiles.length > 0);
    for (const f of clientFiles) assert.ok(!/lib\/cards\/fetchCards|cards\/WebCards/.test(readFileSync(f, "utf8")), `${f} imports the cards client`);
  });

  finish();
}

main();
