// lib/dutchieR2.test.ts
//
// Dutchie r2 on the receipt page: printed tax lines, fees, the printed Total
// Discount (cart-level included), the loyalty block, the enroll link's
// per-merchant config, the click counter, and the wider client redaction.
// Standalone tsx script:  npm run test:dutchieR2
//
// Fixtures: lib/__fixtures__/dutchieParsedR2.ts (contract-shaped; see there).

import assert from "node:assert/strict";
import { normalizePayload, parsedToSummary, redactCustomerIds, redactDutchieSummary, type ParsedReceiptPayload } from "./rdhParsed";
import { summarizeReceipt } from "./receiptSummary";
import { defaultStyle } from "./escpos";
import { loyaltyViewOf } from "./loyaltyView";
import { MERCHANT_LOYALTY, enrollCtaFor, merchantIdForName } from "./merchantLoyalty";
import { DUTCHIE_R2_CART, DUTCHIE_R2_FEE, DUTCHIE_R2_MEMBER, DUTCHIE_R2_NONMEMBER } from "./__fixtures__/dutchieParsedR2";
import { DUTCHIE_PARSED_FEE } from "./__fixtures__/dutchieParsed";
import {
  LOYALTY_CLICK_RATE_LIMIT,
  eventId,
  handleLoyaltyClick,
  pacificDay,
  type LoyaltyClickEvent,
  type LoyaltyClickStore,
} from "./server/loyaltyClick/handler";
import { createRateLimiter } from "./server/signup/rateLimit";
import { reportLoyaltyClick } from "../app/r/LoyaltyEnrollLink";

let passed = 0;
let failed = 0;
const pending: Promise<void>[] = [];
function test(name: string, fn: () => void | Promise<void>) {
  pending.push(
    (async () => {
      try {
        await fn();
        passed += 1;
        console.log(`  ok - ${name}`);
      } catch (err) {
        failed += 1;
        console.error(`  FAIL - ${name}`);
        console.error(err instanceof Error ? err.message : err);
      }
    })(),
  );
}

const receiptOf = (raw: unknown) => (normalizePayload(raw) as ParsedReceiptPayload).receipt!;
const summaryOf = (raw: unknown) => parsedToSummary(receiptOf(raw));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
/** Subtotal + every tax line + every fee - discount, to the cent. */
const reconciled = (raw: unknown) => {
  const s = summaryOf(raw);
  return (
    (s.subtotal ?? 0) +
    sum((s.taxLines ?? []).map((l) => l.amount)) +
    sum((s.fees ?? []).map((l) => l.amount)) -
    (s.discount ?? 0)
  ).toFixed(2);
};

// ---- totals --------------------------------------------------------------------

test("fee: Pay By Bank Fee is its own row and the totals reconcile (8.50 + 1.50 + 0.26 - 2.50 = 7.76)", () => {
  const s = summaryOf(DUTCHIE_R2_FEE);
  assert.deepEqual(s.fees, [{ label: "Pay By Bank Fee", amount: 0.26 }]);
  assert.equal(s.subtotal, 8.5);
  assert.equal(s.discount, 2.5);
  assert.equal(s.total, 7.76);
  assert.equal(reconciled(DUTCHIE_R2_FEE), "7.76");
});

test("tax: each printed component with its printed label, and never a derived rate", () => {
  const s = summaryOf(DUTCHIE_R2_FEE);
  assert.deepEqual(s.taxLines, [
    { label: "CA Sales 8.625%", amount: 0.6 },
    { label: "CA Excise 15%", amount: 0.9 },
  ]);
  assert.equal(s.deriveTaxRate, false);
});

test("cart discount: the printed Total Discount is shown and the subtotal is the printed one (43.43)", () => {
  const s = summaryOf(DUTCHIE_R2_CART);
  assert.equal(s.discount, 5);
  assert.equal(s.subtotal, 43.43);
  assert.equal(reconciled(DUTCHIE_R2_CART), "48.00");
});

test("member: item + Total Discount agree; reconciles to 40.00", () => {
  const s = summaryOf(DUTCHIE_R2_MEMBER);
  assert.equal(s.discount, 10);
  assert.equal(reconciled(DUTCHIE_R2_MEMBER), "40.00");
});

test("backward compatible: a row without the r2 fields renders as before (no tax lines, no fees)", () => {
  const s = summaryOf(DUTCHIE_PARSED_FEE);
  assert.equal(s.taxLines, undefined);
  assert.equal(s.fees, undefined);
  assert.equal(s.discount, 2.5, "falls back to the per-item discounts");
  assert.equal(s.subtotal, 8.5);
  assert.equal(s.deriveTaxRate, false, "still no blended rate for a Dutchie row");
  const r = receiptOf(DUTCHIE_PARSED_FEE);
  assert.deepEqual([r.taxComponents, r.fees, r.discountTotal, r.loyalty], [[], [], null, null]);
});

test("normalisation drops malformed r2 entries instead of rendering them", () => {
  const raw = structuredClone(DUTCHIE_R2_FEE) as { receipt: Record<string, unknown> };
  raw.receipt.fees = [{ label: "Fee" }, { amount: 1 }, "x", { label: "Ok", amount: "0.5" }];
  raw.receipt.loyalty = "yes";
  const r = receiptOf(raw);
  assert.deepEqual(r.fees, [{ label: "Ok", amount: 0.5 }]);
  assert.equal(r.loyalty, null);
});

// ---- loyalty -------------------------------------------------------------------

test("loyalty member: earned + balance, 'Used' only when > 0", () => {
  const r = receiptOf(DUTCHIE_R2_MEMBER);
  assert.deepEqual(loyaltyViewOf(r.loyalty, r.merchantName), {
    kind: "points",
    title: "Rewards",
    line: "You earned 0.96 points · Balance 13.30 points",
    tier: null,
  });
  const used = { ...r.loyalty!, pointsRedeemed: 2 };
  assert.equal(
    (loyaltyViewOf(used, r.merchantName) as { line: string }).line,
    "You earned 0.96 points · Used 2.00 points · Balance 13.30 points",
  );
});

test("loyalty non-member: the merchant's enroll CTA", () => {
  const r = receiptOf(DUTCHIE_R2_NONMEMBER);
  const v = loyaltyViewOf(r.loyalty, r.merchantName);
  assert.equal(v?.kind, "enroll");
  assert.deepEqual((v as { cta: unknown }).cta, {
    merchantId: "union-street-cannabis-club",
    href: "https://unioncannabisclub.com/#menu",
    label: "Not a rewards member yet? Join Union's rewards with your email →",
    ctaVersion: "w-enroll-v1",
  });
});

test("loyalty: enrolled null, no block, or a member with no points shows nothing", () => {
  const nul = { enrolled: null, pointsEarned: 1, pointsRedeemed: null, pointsBalance: 2, tier: null, programName: null };
  assert.equal(loyaltyViewOf(nul, "Union Cannabis Club"), null);
  assert.equal(loyaltyViewOf(null, "Union Cannabis Club"), null);
  const empty = { enrolled: true, pointsEarned: null, pointsRedeemed: null, pointsBalance: null, tier: null, programName: null };
  assert.equal(loyaltyViewOf(empty, "Union Cannabis Club"), null);
});

test("enroll CTA: hidden for an unknown merchant, a disabled entry, or no URL", () => {
  const notMember = { enrolled: false, pointsEarned: null, pointsRedeemed: null, pointsBalance: null, tier: null, programName: null };
  assert.equal(loyaltyViewOf(notMember, "Some Other Shop"), null);
  assert.equal(merchantIdForName("union cannabis club"), "union-street-cannabis-club", "case-insensitive");
  assert.equal(enrollCtaFor(null), null);
  const cfg = MERCHANT_LOYALTY["union-street-cannabis-club"] as { enrollCtaEnabled: boolean; enrollUrl: string | null };
  const saved = { ...cfg };
  try {
    cfg.enrollCtaEnabled = false;
    assert.equal(enrollCtaFor("union-street-cannabis-club"), null);
    cfg.enrollCtaEnabled = true;
    cfg.enrollUrl = null;
    assert.equal(enrollCtaFor("union-street-cannabis-club"), null);
  } finally {
    Object.assign(cfg, saved);
  }
});

// ---- PII -------------------------------------------------------------------------

const PII = [
  "Customer:: 35344464",
  "Customer Phone: (415) 555-0142",
  "Customer: Jane Doe",
  "Member: Jane Doe",
  "Member Name: Jane Doe",
  "Email: jane@example.com",
  "E-mail Address: jane@example.com",
  "MMJ ID: A1234567",
  "Loyalty Phone: 4155550142",
  "Loyalty ID: 99887766",
  "Rewards Email: jane@example.com",
  "Patient: 1557545",
];
const KEEP = [
  "Due Customer: $7.00",
  "Loyalty Points Earned: 0.96",
  "Loyalty Points Total: 13.30",
  "Loyalty Points Used: 0.00",
  "Loyalty Points: ** Not opted-into program **",
  "Order: 140023547",
  "Cashier: 10003",
  "  Batch: Batch name",
  "Product Name - flower (3g)",
];

test("redaction: every id/contact line is redacted, label kept", () => {
  for (const line of PII) {
    const out = redactCustomerIds(line);
    assert.match(out, /^[^:]+:{1,2} \[redacted\]$/, line);
    assert.doesNotMatch(out, /\d{4}|jane|Jane/, line);
  }
});

test("redaction: points, change, order and item lines are untouched", () => {
  for (const line of KEEP) assert.equal(redactCustomerIds(line), line);
});

test("local-parse path: a Dutchie receipt's PII lines are gone, and no PII line survives as an item", () => {
  const text = [
    "Union Cannabis Club", "Order: 1", "Cashier: 2", ...PII, "WIDGET", "  1 @ 4.00 ea   4.00",
    "Subtotal: $4.00", "Total Discount: $0.00", "Total: $4.00", "Due Customer: $0.00", "Total Items: 1",
    "Loyalty Phone: 4155550142.00",
  ].join("\n");
  const local = summarizeReceipt(text.split("\n").map((t) => ({ text: t, align: "left" as const, style: defaultStyle() })));
  const s = redactDutchieSummary(local);
  const all = JSON.stringify(s);
  assert.doesNotMatch(all, /35344464|555-0142|4155550142|Jane|jane@|A1234567|1557545|99887766/);
});

// ---- click counting ---------------------------------------------------------------

function fakeStore() {
  const events: LoyaltyClickEvent[] = [];
  const ids = new Set<string>();
  const store: LoyaltyClickStore = {
    async record(e) {
      const id = eventId(e);
      if (ids.has(id)) return "duplicate";
      ids.add(id);
      events.push(e);
      return "recorded";
    },
  };
  return { store, events };
}
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)";
const body = (o: Record<string, unknown> = {}) =>
  JSON.stringify({ merchantId: "union-street-cannabis-club", sid: "f7c20c7a26845706", page: "w", ctaVersion: "w-enroll-v1", ...o });
const at = (iso: string) => () => new Date(iso);

test("click: recorded once per sid per minute, with the Pacific day and a coarse platform only", async () => {
  const { store, events } = fakeStore();
  const deps = { getStore: () => store, rateLimiter: createRateLimiter(LOYALTY_CLICK_RATE_LIMIT), now: at("2026-10-08T02:30:10Z"), log: { error() {} } };
  const input = { bodyText: body(), ip: "203.0.113.9", userAgent: IPHONE };
  assert.deepEqual(await handleLoyaltyClick(input, deps), { status: 200, body: { ok: true } });
  assert.deepEqual(await handleLoyaltyClick(input, { ...deps, now: at("2026-10-08T02:30:50Z") }), {
    status: 200,
    body: { ok: true, deduped: true },
  });
  assert.equal((await handleLoyaltyClick(input, { ...deps, now: at("2026-10-08T02:31:01Z") })).status, 200);
  assert.equal(events.length, 2);
  assert.equal(events[0].day, "2026-10-07", "02:30Z is the evening of the 7th in California");
  assert.equal(events[0].platform, "ios");
  assert.deepEqual(Object.keys(events[0]).sort(), ["ctaVersion", "day", "merchantId", "minute", "page", "platform", "sid"]);
  assert.doesNotMatch(JSON.stringify(events), /203\.0\.113|iPhone OS/);
});

test("click: anything not a live CTA is rejected without touching the store", async () => {
  const { store, events } = fakeStore();
  const deps = { getStore: () => store, rateLimiter: createRateLimiter(LOYALTY_CLICK_RATE_LIMIT), now: at("2026-10-07T20:00:00Z"), log: { error() {} } };
  const run = (b: string | null) => handleLoyaltyClick({ bodyText: b, ip: "x", userAgent: "" }, deps);
  assert.equal((await run(body({ merchantId: "other" }))).body.error, "unknown_merchant");
  assert.equal((await run(body({ sid: "nope" }))).body.error, "bad_sid");
  assert.equal((await run(body({ page: "r" }))).body.error, "bad_page");
  assert.equal((await run(body({ ctaVersion: "v0" }))).body.error, "bad_cta_version");
  assert.equal((await run("{")).body.error, "bad_json");
  assert.equal((await run(null)).status, 413);
  assert.equal(events.length, 0);
  const noStore = await handleLoyaltyClick({ bodyText: body(), ip: "x", userAgent: "" }, { ...deps, getStore: () => null });
  assert.equal(noStore.status, 503);
});

test("click: per-IP rate limit", async () => {
  const { store } = fakeStore();
  const deps = { getStore: () => store, rateLimiter: createRateLimiter({ limit: 2, windowMs: 60_000 }), now: at("2026-10-07T20:00:00Z"), log: { error() {} } };
  const input = { bodyText: body(), ip: "198.51.100.1", userAgent: "" };
  await handleLoyaltyClick(input, deps);
  await handleLoyaltyClick(input, deps);
  assert.equal((await handleLoyaltyClick(input, deps)).status, 429);
});

test("pacificDay handles DST edges", () => {
  assert.equal(pacificDay(new Date("2026-11-01T07:30:00Z")), "2026-11-01");
  assert.equal(pacificDay(new Date("2026-03-08T07:59:00Z")), "2026-03-07");
});

test("reportLoyaltyClick: beacon first, fetch keepalive if the beacon is refused, never throws", () => {
  const click = { merchantId: "union-street-cannabis-club", sid: "f7c20c7a26845706", page: "w" as const, ctaVersion: "w-enroll-v1" };
  let fetched: RequestInit | null = null;
  const doFetch = async (_u: string, init: RequestInit) => {
    fetched = init;
  };
  assert.equal(reportLoyaltyClick(click, { sendBeacon: () => true }, doFetch), "beacon");
  assert.equal(fetched, null);
  assert.equal(reportLoyaltyClick(click, { sendBeacon: () => false }, doFetch), "fetch");
  assert.equal((fetched as RequestInit | null)?.keepalive, true);
  assert.equal(
    reportLoyaltyClick(click, { sendBeacon: () => { throw new Error("x"); } }, () => { throw new Error("y"); }),
    "none",
  );
  assert.equal(reportLoyaltyClick(click, {}, doFetch), "fetch", "no sendBeacon at all (old browser)");
});

void Promise.all(pending).then(() => {
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
});
