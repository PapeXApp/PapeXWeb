// app/r/cardsGrant.test.tsx
//
// 1.7.1 PapeX #27: /r offers go to the TAPPER, not to whoever holds the sid.
// Standalone tsx script:  npm run test:cardsGrant
//
// Proves:
//   - lib/cards/grant.ts: cookie read/write, shapes, max-age.
//   - lib/cards/fetchCards.ts: a stored grant is sent as x-papex-cards-grant;
//     a NEW tap grant from the service comes back as `mintedGrant`; a
//     re-echoed or malformed one does not; an owner grant is never stored.
//   - the real /r page: the grant cookie for THIS sid (only) reaches the cards
//     request; no cookie = today's request (Accept only); a minted grant with
//     cards drawn renders the KeepCardsGrant island, and a page with no cards
//     stays byte-identical to its parity golden.
//   - the cookie route: same-origin only, tap grants only, Path=/r, HttpOnly,
//     Secure, SameSite=Lax, Max-Age bounded by the grant's own expiry.

import { calls, finish, test, testClock, testRequest, RDH, type Upstream } from "./testPageHarness";
import { runScenario } from "./testRunScenario";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { SCENARIOS } from "./testParityScenarios";
import { fetchWebCards, webCardsUrl } from "@/lib/cards/fetchCards";
import {
  CARDS_GRANT_HEADER,
  MAX_GRANT_COOKIE_S,
  grantCookieMaxAge,
  grantSetCookie,
  readGrantCookie,
  sameOrigin,
} from "@/lib/cards/grant";
import { POST } from "@/app/api/r/[sid]/cards-grant/route";

const ROOT = resolve(__dirname, "../..");
const VARIANTS = join(ROOT, "contracts/cards/v1/fixtures/variants");
const readVariant = (f: string) => readFileSync(join(VARIANTS, f), "utf8");
const MAC = "B".repeat(43);
const nowS = () => Math.floor(testClock.nowMs / 1000);
const tapGrant = (expS = nowS() + 3600) => `g1.t.${expS}.${MAC}`;
const ownerGrant = (expS = nowS() + 3600) => `g1.o.${expS}.${MAC}`;

const scenario = SCENARIOS.find((s) => s.name === "sid-text")!;
const SID = scenario.cardsSid!;
const offerBody = readVariant("rf-offer-code128.json").replace("7e57ca4d00000001", SID);
const cards = (headers?: Record<string, string>): Upstream => ({
  status: 200,
  body: offerBody,
  contentType: "application/json",
  headers,
});
const cardsCall = () => calls.find((c) => c.url === webCardsUrl(SID));

async function main() {
  // ---- lib/cards/grant.ts -----------------------------------------------------------
  await test("readGrantCookie: this sid's tap grant only; owner/malformed/other sids ignored", () => {
    const g = tapGrant();
    assert.equal(readGrantCookie(`a=1; pxcg_${SID}=${g}; b=2`, SID), g);
    assert.equal(readGrantCookie(`pxcg_ffffffffffffffff=${g}`, SID), undefined);
    assert.equal(readGrantCookie(`pxcg_${SID}=${ownerGrant()}`, SID), undefined);
    assert.equal(readGrantCookie(`pxcg_${SID}=junk`, SID), undefined);
    assert.equal(readGrantCookie(undefined, SID), undefined);
  });

  await test("grantSetCookie: scoped, httpOnly, Secure, Lax, max-age from the grant, capped", () => {
    const c = grantSetCookie(SID, tapGrant(nowS() + 600), testClock.nowMs)!;
    assert.equal(c, `pxcg_${SID}=${tapGrant(nowS() + 600)}; Path=/r; Max-Age=600; HttpOnly; Secure; SameSite=Lax`);
    assert.equal(grantCookieMaxAge(tapGrant(nowS() + 10 * 24 * 3600), testClock.nowMs), MAX_GRANT_COOKIE_S);
    assert.equal(grantSetCookie(SID, tapGrant(nowS() - 1), testClock.nowMs), null);
    assert.equal(grantSetCookie(SID, ownerGrant(), testClock.nowMs), null);
  });

  // ---- lib/cards/fetchCards.ts -----------------------------------------------------------
  const fakeFetch = (respHeaders: Record<string, string> = {}) => {
    const seen: Headers[] = [];
    const impl = (async (_url: string, init?: RequestInit) => {
      seen.push(new Headers(init?.headers));
      return new Response(offerBody, { status: 200, headers: respHeaders });
    }) as unknown as typeof fetch;
    return { impl, seen };
  };

  await test("fetchWebCards: no grant = Accept only (the 1.7.0 request)", async () => {
    const f = fakeFetch();
    await fetchWebCards(SID, { now: new Date(testClock.nowMs), fetchImpl: f.impl });
    assert.deepEqual([...f.seen[0].keys()], ["accept"]);
  });

  await test("fetchWebCards: a stored grant is presented; a malformed one is not", async () => {
    const f = fakeFetch();
    await fetchWebCards(SID, { now: new Date(testClock.nowMs), fetchImpl: f.impl, grant: tapGrant() });
    assert.equal(f.seen[0].get(CARDS_GRANT_HEADER), tapGrant());
    const g = fakeFetch();
    await fetchWebCards(SID, { now: new Date(testClock.nowMs), fetchImpl: g.impl, grant: "Bearer x" });
    assert.equal(g.seen[0].get(CARDS_GRANT_HEADER), null);
  });

  await test("fetchWebCards: a NEW tap grant comes back as mintedGrant; an echo, an owner grant or junk does not", async () => {
    const minted = tapGrant(nowS() + 7200);
    const r1 = await fetchWebCards(SID, { now: new Date(testClock.nowMs), fetchImpl: fakeFetch({ [CARDS_GRANT_HEADER]: minted }).impl });
    assert.equal(r1.mintedGrant, minted);
    const r2 = await fetchWebCards(SID, {
      now: new Date(testClock.nowMs),
      fetchImpl: fakeFetch({ [CARDS_GRANT_HEADER]: minted }).impl,
      grant: minted,
    });
    assert.equal(r2.mintedGrant, undefined);
    for (const bad of [ownerGrant(), "nope"]) {
      const r = await fetchWebCards(SID, { now: new Date(testClock.nowMs), fetchImpl: fakeFetch({ [CARDS_GRANT_HEADER]: bad }).impl });
      assert.equal(r.mintedGrant, undefined, bad);
    }
  });

  // ---- the real /r page -----------------------------------------------------------
  await test("/r: the tapper's cookie grant reaches the cards request", async () => {
    testRequest.cookie = `other=1; pxcg_${SID}=${tapGrant()}`;
    try {
      await runScenario(scenario, { [webCardsUrl(SID)]: cards() });
      assert.equal(cardsCall()?.headers[CARDS_GRANT_HEADER], tapGrant());
    } finally {
      testRequest.cookie = undefined;
    }
  });

  await test("/r: no cookie, or a cookie for ANOTHER sid -> no grant header (a forwarded sid is just a sid)", async () => {
    await runScenario(scenario, { [webCardsUrl(SID)]: cards() });
    assert.equal(cardsCall()?.headers[CARDS_GRANT_HEADER], undefined);
    testRequest.cookie = `pxcg_ffffffffffffffff=${tapGrant()}`;
    try {
      await runScenario(scenario, { [webCardsUrl(SID)]: cards() });
      assert.equal(cardsCall()?.headers[CARDS_GRANT_HEADER], undefined);
    } finally {
      testRequest.cookie = undefined;
    }
  });

  // The island renders nothing, so the visible page is unchanged. (In a real
  // Next render its props, the grant included, ride in THIS tapper's own RSC
  // payload; never in the URL, so a forwarded link carries no grant.)
  await test("/r: a minted grant does not change the visible HTML (the island renders nothing)", async () => {
    const plain = await runScenario(scenario, { [webCardsUrl(SID)]: cards() });
    const minted = await runScenario(scenario, { [webCardsUrl(SID)]: cards({ [CARDS_GRANT_HEADER]: tapGrant() }) });
    assert.equal(minted.html, plain.html);
  });

  await test("/r source: both card branches hand a minted grant to the island; nothing else does", () => {
    const page = readFileSync(join(__dirname, "page.tsx"), "utf8");
    assert.match(page, /keepGrant=\{keepGrant\}/);
    assert.equal((page.match(/sid=\{rawSid\} \/>/g) ?? []).length, 2, "both streamed slots get the sid");
    assert.match(page, /readGrantCookie\(requestHeaders\.get\("cookie"\), rawSid\)/);
    const stack = readFileSync(join(__dirname, "cards/WebCards.tsx"), "utf8");
    assert.match(stack, /\{keepGrant \? <KeepCardsGrant sid=\{keepGrant\.sid\} grant=\{keepGrant\.grant\} \/> : null\}/);
  });

  // ---- the cookie route -----------------------------------------------------------
  const post = (sid: string, body: unknown, origin?: string) =>
    POST(
      new Request(`https://papex.app/api/r/${sid}/cards-grant`, {
        method: "POST",
        headers: { "content-type": "application/json", ...(origin ? { origin } : {}) },
        body: typeof body === "string" ? body : JSON.stringify(body),
      }),
      { params: Promise.resolve({ sid }) },
    );

  await test("route: stores a tap grant for a valid sid, same-origin", async () => {
    const res = await post(SID, { grant: tapGrant() }, "https://papex.app");
    assert.equal(res.status, 204);
    const set = res.headers.get("set-cookie") ?? "";
    assert.match(set, new RegExp(`^pxcg_${SID}=g1\\.t\\.`));
    for (const attr of ["Path=/r", "HttpOnly", "Secure", "SameSite=Lax"]) assert.ok(set.includes(attr), attr);
    assert.equal(res.headers.get("cache-control"), "no-store");
  });

  await test("route: refuses cross-site, owner grants, junk, bad sids", async () => {
    assert.equal((await post(SID, { grant: tapGrant() }, "https://evil.example")).status, 403);
    assert.equal((await post(SID, { grant: ownerGrant() })).status, 400);
    assert.equal((await post(SID, "not json")).status, 400);
    assert.equal((await post(SID, { grant: tapGrant(nowS() - 5) })).status, 400);
    assert.equal((await post("XYZ", { grant: tapGrant() })).status, 404);
    assert.equal(sameOrigin(new Request("https://papex.app/x", { headers: { origin: "null" } })), false);
  });

  // Keep an unused import honest for readers: RDH is the cards host under test.
  assert.ok(webCardsUrl(SID).startsWith(RDH));
  finish();
}

main();
