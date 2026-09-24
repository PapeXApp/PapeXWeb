// lib/cards/fetchCards.test.ts
//
// The web cards client: request shape, budget, fail-closed decoding, the demo
// skip rule and the web-caps filter. Standalone tsx script:
//   npm run test:cardsFetch

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  WEB_CAPS,
  WEB_CARDS_TIMEOUT_MS,
  fetchWebCards,
  mayFetchWebCards,
  restrictToWebCaps,
  startWebCards,
  webCardsUrl,
} from "./fetchCards";
import { normalizeResolvedCards } from "./normalize";
import { CAPS_1_7_0 } from "./types";
import { DEMO_SIDS } from "@/lib/demoReceipts";

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL - ${name}`);
    console.error(err instanceof Error ? err.message : err);
  }
}

const VARIANTS = resolve(__dirname, "../../contracts/cards/v1/fixtures/variants");
const read = (f: string) => readFileSync(join(VARIANTS, f), "utf8");
interface IndexVariant {
  sid: string;
  variant: string;
  responses: Record<string, string>;
  expectCardIds: Record<string, string[]>;
  layout: string;
}
interface IndexFile {
  capsBySurface: Record<string, string>;
  variants: IndexVariant[];
  clientOnly: { file: string; requestSid: string; now: string | null; expectCardIds: string[]; expectLayout?: string }[];
}
const INDEX = JSON.parse(read("INDEX.json")) as IndexFile;

/** Render clock for the variants: every live test offer expires 2026-11-01T06:59:59Z. */
const NOW = new Date("2026-10-01T17:00:00Z");
const SID = "7e57ca4d00000001";

interface Seen {
  url: string;
  init?: RequestInit;
}
function fakeFetch(respond: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const seen: Seen[] = [];
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    seen.push({ url, init });
    return respond(url, init);
  }) as typeof fetch;
  return { impl, seen };
}
const jsonRes = (body: string, status = 200, headers: Record<string, string> = {}) =>
  new Response(body, { status, headers: { "Content-Type": "application/json", ...headers } });

/** A response whose body never finishes until the request is aborted. */
function stalledBody(signal: AbortSignal | null | undefined, first = "{"): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(first));
      signal?.addEventListener("abort", () => controller.error(new DOMException("aborted", "AbortError")));
    },
  });
  return new Response(stream, { status: 200 });
}

async function main() {
  // ---- the request ---------------------------------------------------------------

  await test("URL: surface=web, schema=1, the web caps row verbatim (| as %7C)", () => {
    const url = webCardsUrl(SID);
    assert.equal(
      url,
      "https://api.papex.app/receipt/7e57ca4d00000001/cards?surface=web&schema=1&caps=" + CAPS_1_7_0.web.replace(/\|/g, "%7C"),
    );
    const caps = new URL(url).searchParams.get("caps");
    assert.equal(caps, CAPS_1_7_0.web, "decodes to exactly the contract row");
    assert.equal(caps, INDEX.capsBySurface.web, "and to INDEX.json's web row");
    assert.equal(WEB_CAPS, CAPS_1_7_0.web);
  });

  await test("budget is 2.5 s; no-store; Accept JSON; one request, no retry", async () => {
    assert.equal(WEB_CARDS_TIMEOUT_MS, 2500);
    const f = fakeFetch(() => new Response("", { status: 503 }));
    await fetchWebCards(SID, { now: NOW, fetchImpl: f.impl });
    assert.equal(f.seen.length, 1, "exactly one request, even after a failure");
    assert.equal(f.seen[0].init?.cache, "no-store");
    assert.equal((f.seen[0].init?.headers as Record<string, string>).Accept, "application/json");
    assert.ok(f.seen[0].init?.signal, "abortable");
  });

  await test("demo-registry sids and malformed sids never fetch", async () => {
    assert.ok(DEMO_SIDS.size >= 3);
    for (const sid of [...DEMO_SIDS, "5ca1e00000000001", "b0de9a0000000001", "5371e4f000000001", "NOT-A-SID", "", "5CA1E00000000001"]) {
      assert.equal(mayFetchWebCards(sid), false, sid);
      const f = fakeFetch(() => jsonRes(read("rf-offer-code128.json")));
      const r = await fetchWebCards(sid, { now: NOW, fetchImpl: f.impl });
      assert.equal(f.seen.length, 0, `${sid} fetched`);
      assert.equal(r.outcome, "skipped");
      assert.deepEqual(r.cards.cards, []);
    }
    assert.equal(mayFetchWebCards("7e57ca4d00000001"), true, "test sids are not demo sids");
  });

  // ---- every surface=web fixture ---------------------------------------------------

  for (const v of INDEX.variants) {
    await test(`variant ${v.sid} ${v.variant} (web): cards ${JSON.stringify(v.expectCardIds.web)}, layout ${v.layout}`, async () => {
      const f = fakeFetch(() => jsonRes(read(v.responses.web)));
      const r = await fetchWebCards(v.sid, { now: NOW, fetchImpl: f.impl });
      assert.equal(r.outcome, "ok");
      assert.deepEqual(r.cards.cards.map((c) => c.id), v.expectCardIds.web);
      if (v.expectCardIds.web.length > 0) assert.equal(r.cards.layout.order, v.layout);
      for (const c of r.cards.cards) {
        if (c.type === "offer") assert.equal(c.actions, undefined, "no Save on web");
      }
    });
  }

  await test("the app responses carry Save; on the web client it is stripped, the offer kept", async () => {
    const v = INDEX.variants.find((x) => x.variant === "rf-offer-code128")!;
    const f = fakeFetch(() => jsonRes(read(v.responses.app)));
    const r = await fetchWebCards(v.sid, { now: NOW, fetchImpl: f.impl });
    const offer = r.cards.cards.find((c) => c.type === "offer");
    assert.ok(offer, "offer kept");
    assert.equal(offer.type === "offer" && offer.actions, undefined);
    const raw = JSON.parse(read(v.responses.app));
    assert.ok(raw.cards.some((c: { actions?: unknown[] }) => c.actions?.length), "fixture really has a save action");
  });

  // ---- client-only fixtures -----------------------------------------------------------

  for (const c of INDEX.clientOnly) {
    await test(`client-only ${c.file}: survivors ${JSON.stringify(c.expectCardIds)}`, async () => {
      const f = fakeFetch(() => jsonRes(read(c.file)));
      const r = await fetchWebCards(c.requestSid, { now: c.now ? new Date(c.now) : NOW, fetchImpl: f.impl });
      assert.deepEqual(r.cards.cards.map((x) => x.id), c.expectCardIds);
      if (c.expectLayout) assert.equal(r.cards.layout.order, c.expectLayout);
    });
  }

  // ---- fail closed -----------------------------------------------------------------------

  const failures: [string, (url: string, init?: RequestInit) => Response | Promise<Response>, string][] = [
    ["404", () => new Response("", { status: 404 }), "http"],
    ["400", () => jsonRes('{"error":"bad"}', 400), "http"],
    ["500", () => new Response("oops", { status: 500 }), "http"],
    ["204", () => new Response(null, { status: 204 }), "http"],
    ["201 with a valid body", () => jsonRes(read("rf-offer-code128.json"), 201), "http"],
    ["network error", () => Promise.reject(new TypeError("fetch failed")), "network"],
    ["fetch throws synchronously", () => { throw new Error("boom"); }, "network"],
    ["not JSON", () => jsonRes("<html>gateway</html>"), "rejected"],
    ["empty body", () => jsonRes(""), "rejected"],
    ["invalid UTF-8", () => new Response(new Uint8Array([0x7b, 0xff, 0xfe, 0x7d]), { status: 200 }), "encoding"],
    ["oversize, declared", () => jsonRes(read("rf-offer-code128.json"), 200, { "Content-Length": "40000" }), "oversize"],
    ["oversize, streamed", () => new Response(" ".repeat(32_769), { status: 200 }), "oversize"],
    ["sid mismatch", () => jsonRes(read("cf-offer-code128.json")), "rejected"],
    ["schemaVersion 2", () => jsonRes(read("rf-offer-code128.json").replace('"schemaVersion": 1', '"schemaVersion": 2')), "rejected"],
    ["status none", () => jsonRes(read("status-none.json").replace("7e57ca4d00000017", SID)), "ok"],
    ["status degraded", () => jsonRes(read("status-degraded.json").replace("7e57ca4d00000018", SID)), "ok"],
  ];
  for (const [name, respond, outcome] of failures) {
    await test(`fail closed: ${name} -> no cards (${outcome})`, async () => {
      const f = fakeFetch(respond);
      const r = await fetchWebCards(SID, { now: NOW, fetchImpl: f.impl });
      assert.equal(r.outcome, outcome);
      assert.deepEqual(r.cards.cards, []);
      assert.equal(r.cards.status, "none");
    });
  }

  await test("exactly 32 768 bytes is still accepted by the size cap", async () => {
    const body = read("rf-offer-code128.json");
    const padded = body + " ".repeat(32_768 - Buffer.byteLength(body));
    const r = await fetchWebCards(SID, { now: NOW, fetchImpl: fakeFetch(() => jsonRes(padded)).impl });
    assert.deepEqual(r.cards.cards.map((c) => c.id), ["tc-offer-1"]);
  });

  await test("timeout: a hung request gives up at the budget", async () => {
    const f = fakeFetch((_u, init) => new Promise<Response>((_, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    }));
    const t0 = performance.now();
    const r = await fetchWebCards(SID, { now: NOW, fetchImpl: f.impl, timeoutMs: 60 });
    const took = performance.now() - t0;
    assert.equal(r.outcome, "timeout");
    assert.deepEqual(r.cards.cards, []);
    assert.ok(took >= 55 && took < 1000, `took ${took} ms`);
  });

  await test("timeout: the budget covers the body read (headers arrive, the body stalls)", async () => {
    const f = fakeFetch((_u, init) => stalledBody(init?.signal));
    const t0 = performance.now();
    const r = await fetchWebCards(SID, { now: NOW, fetchImpl: f.impl, timeoutMs: 60 });
    assert.equal(r.outcome, "timeout");
    assert.ok(performance.now() - t0 < 1000);
  });

  await test("hideWhenExpired is evaluated with the render clock", async () => {
    const v = INDEX.variants.find((x) => x.variant === "rf-offer-code128")!;
    const body = read(v.responses.web);
    const before = await fetchWebCards(v.sid, { now: new Date("2026-11-01T06:59:59Z"), fetchImpl: fakeFetch(() => jsonRes(body)).impl });
    const after = await fetchWebCards(v.sid, { now: new Date("2026-11-01T07:00:00Z"), fetchImpl: fakeFetch(() => jsonRes(body)).impl });
    assert.deepEqual(before.cards.cards.map((c) => c.id), ["tc-offer-1"]);
    assert.deepEqual(after.cards.cards.map((c) => c.id), [], "a lapsed offer is not drawn");
  });

  // ---- the web-caps filter --------------------------------------------------------------

  await test("restrictToWebCaps drops the P0-only types the web does not ask for (loyalty/insight/emailCapture)", () => {
    const base = { schemaVersion: 1, sid: SID, status: "ok", merchant: { partner: true, ageRestricted: false } };
    const fixture = (f: string) => JSON.parse(readFileSync(resolve(__dirname, "../../contracts/cards/v1/fixtures/valid", f), "utf8"));
    const cards = [
      ...fixture("loyalty.json").cards,
      ...fixture("insight.json").cards,
      ...fixture("email-capture.json").cards,
      ...fixture("text.json").cards,
    ];
    const n = normalizeResolvedCards({ ...base, cards }, SID);
    assert.ok(n.cards.some((c) => c.type === "loyalty") && n.cards.some((c) => c.type === "emailCapture"), "decoder accepts them");
    const web = restrictToWebCaps(n);
    assert.deepEqual([...new Set(web.cards.map((c) => c.type))], ["text"]);
    assert.ok(web.dropped.some((d) => d.reason === "not in web caps"));
  });

  await test("startWebCards: peek() is undefined until the request settles, then the result", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const f = fakeFetch(async () => {
      await gate;
      return jsonRes(read("rf-offer-code128.json"));
    });
    const task = startWebCards(SID, { now: NOW, fetchImpl: f.impl });
    await new Promise((r) => setTimeout(r, 5));
    assert.equal(task.peek(), undefined);
    release();
    const r = await task.promise;
    assert.equal(task.peek(), r);
    assert.deepEqual(r.cards.cards.map((c) => c.id), ["tc-offer-1"]);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
