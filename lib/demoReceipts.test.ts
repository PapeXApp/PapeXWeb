// lib/demoReceipts.test.ts
//
// Standalone test script for the demo-receipt allowlist and the demo routes'
// front door (no test framework in this repo — see package.json). Run with:
//   npm run test:demo
// (uses `tsx`, same pattern as lib/merchantHost.test.ts / lib/escpos.test.ts.)
//
// The load-bearing assertions here are the negative ones. `isDemoSid` only
// ever REMOVES the "Save to PapeX" affordance, so a false negative costs a
// demo its polish, while a false positive silently takes the Save button away
// from a real customer holding a real receipt. Every test below that says
// "not a demo sid" is guarding that direction.

import assert from "node:assert/strict";
import { isValidSid } from "./rdh";
import {
  DEMO_RECEIPTS,
  DEMO_SIDS,
  LOYALTY_DISCLOSURE,
  formatCountWord,
  formatDaysRemaining,
  formatMoney,
  formatMoneyCompact,
  formatOfferQualifier,
  formatOfferSentence,
  formatOfferValidity,
  formatPoints,
  getDemoEnrichment,
  insightEvidenceRows,
  isDemoSid,
  isEnrichmentEmpty,
  loyaltyBalanceValue,
  loyaltyNextRung,
  loyaltyPointsToNext,
  loyaltyRungProgress,
  moneyDelta,
  offerDaysRemaining,
  renderInsightCopy,
  resolveDemoRoute,
  savingsComponentsMatchTotal,
} from "./demoReceipts";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL - ${name}`);
    console.error(err instanceof Error ? err.message : err);
  }
}

/** The permanent Sunset Leaf booth tag. */
const DEMO_SID = "5371e4f000000001";

/**
 * Shaped exactly like a real one: 16 lowercase hex, as minted by
 * `randomBytes(8).toString("hex")` in the RDH upload Lambda. Nothing about
 * its FORM may be enough to make it a demo sid — only membership in the
 * literal set is.
 */
const PRODUCTION_SID = "a1b2c3d4e5f60718";

// ---- isDemoSid: the positive case -------------------------------------------

test("isDemoSid: the seeded Sunset Leaf demo sid is recognised", () => {
  assert.equal(isDemoSid(DEMO_SID), true);
});

test("isDemoSid: every sid in DEMO_SIDS is recognised", () => {
  for (const sid of DEMO_SIDS) {
    assert.equal(isDemoSid(sid), true, `DEMO_SIDS member ${sid} not recognised`);
  }
});

// ---- isDemoSid: the negative cases that actually matter ---------------------

test("isDemoSid: a production-shaped sid is NOT a demo sid", () => {
  // The whole design rests on this: membership is a literal set, never a
  // pattern. A well-formed sid that nobody listed keeps its Save button.
  assert.equal(isValidSid(PRODUCTION_SID), true, "fixture must be a valid sid");
  assert.equal(isDemoSid(PRODUCTION_SID), false);
});

test("isDemoSid: a sid sharing a prefix with a demo sid is NOT a demo sid", () => {
  // Guards against anyone ever "simplifying" the set into a prefix rule.
  assert.equal(isDemoSid("5371e4f0ffffffff"), false);
  assert.equal(isDemoSid("5371e4f000000002"), false);
});

test("isDemoSid: an invalid sid is rejected", () => {
  assert.equal(isDemoSid("not-a-sid"), false);
  assert.equal(isDemoSid(""), false);
  assert.equal(isDemoSid(undefined), false);
  assert.equal(isDemoSid(null), false);
  // Too short / too long / non-hex — `isValidSid`'s ^[a-f0-9]{16}$.
  assert.equal(isDemoSid("5371e4f00000000"), false);
  assert.equal(isDemoSid("5371e4f0000000011"), false);
  assert.equal(isDemoSid("5371e4f0000000zz"), false);
});

test("isDemoSid: an uppercase spelling of a demo sid is rejected", () => {
  // Not case folded, deliberately: `isValidSid` is lowercase-only and matches
  // the Lambda's SID_RE exactly, so an uppercase sid is not a valid sid at
  // all — anywhere, including here.
  assert.equal(isDemoSid(DEMO_SID.toUpperCase()), false);
});

// ---- the set itself ---------------------------------------------------------

test("DEMO_SIDS: every member is a well-formed sid", () => {
  // Catches a placeholder left uncommented, a typo, a stray uppercase letter,
  // or a pasted sid with whitespace — any of which would silently make an
  // entry unmatchable and hand a demo tag its Save button back.
  for (const sid of DEMO_SIDS) {
    assert.equal(isValidSid(sid), true, `DEMO_SIDS member ${JSON.stringify(sid)} is not a valid sid`);
  }
});

test("DEMO_SIDS: contains the seeded Sunset Leaf sid", () => {
  assert.equal(DEMO_SIDS.has(DEMO_SID), true);
});

// ---- resolveDemoRoute: /r/demo and /demo/r's front door ---------------------

test("resolveDemoRoute: a demo sid renders", () => {
  assert.deepEqual(resolveDemoRoute(DEMO_SID), { action: "render", sid: DEMO_SID });
});

test("resolveDemoRoute: a production sid REDIRECTS to /r (fail toward production)", () => {
  // The single most important behaviour of the demo route. A real customer's
  // receipt reaching a demo URL must come out the other side with production
  // semantics — never the reverse.
  assert.deepEqual(resolveDemoRoute(PRODUCTION_SID), {
    action: "redirect",
    url: `/r?sid=${PRODUCTION_SID}`,
  });
});

test("resolveDemoRoute: a malformed sid redirects to /r and keeps the sid", () => {
  // `/r` is the route that knows how to say "Receipt not available" for a
  // malformed sid; don't duplicate that judgement in the demo route.
  assert.deepEqual(resolveDemoRoute("not-a-sid"), {
    action: "redirect",
    url: "/r?sid=not-a-sid",
  });
});

test("resolveDemoRoute: a sid needing encoding is escaped, not interpolated raw", () => {
  const d = resolveDemoRoute("a&b=c d");
  assert.equal(d.action, "redirect");
  if (d.action === "redirect") {
    assert.equal(d.url, "/r?sid=a%26b%3Dc%20d");
  }
});

test("resolveDemoRoute: no sid at all redirects to bare /r", () => {
  assert.deepEqual(resolveDemoRoute(undefined), { action: "redirect", url: "/r" });
  assert.deepEqual(resolveDemoRoute(null), { action: "redirect", url: "/r" });
  assert.deepEqual(resolveDemoRoute(""), { action: "redirect", url: "/r" });
  assert.deepEqual(resolveDemoRoute("   "), { action: "redirect", url: "/r" });
});

// =============================================================================
// THE ENRICHMENT LAYER
// =============================================================================
//
// Two kinds of assertion live below, and they guard different things.
//
//   - The ARITHMETIC tests check the seeded figures against themselves: the
//     savings components must sum to the stated total, the loyalty balance
//     must floor-divide to the stated worth, the next rung must be the next
//     rung. These are the numbers a stranger at a booth can check on the same
//     screen, and a figure that disagrees with its own supporting data is a
//     factual claim about a person that we cannot defend. Nothing here can
//     check the figures against the PRINTED blob — that half stays a review
//     responsibility.
//
//   - The EXPIRY tests check a design property rather than a value: that
//     nothing this module renders about time can ever go stale. The stickers
//     are permanent; the receipt behind them is dated once and forever. The
//     voucher therefore states a DURATION, and the urgency chip disappears
//     when the window closes instead of turning into "Expired". Both are
//     asserted at simulated dates years past the window.

/** Demo 1 — the consumer pitch, Hartwell's Market. */
const CONSUMER_SID = "5ca1e00000000001";
/** Demo 2 — the merchant pitch, Ellsworth Market. */
const MERCHANT_SID = "b0de9a0000000001";

/** Noon UTC on the given day — far from any midnight boundary. */
function at(isoDay: string): Date {
  return new Date(`${isoDay}T12:00:00Z`);
}

// ---- Resolution -------------------------------------------------------------

test("getDemoEnrichment: both Tech Week sids resolve to a payload", () => {
  for (const sid of [CONSUMER_SID, MERCHANT_SID]) {
    const e = getDemoEnrichment(sid);
    assert.ok(e, `${sid} has no enrichment`);
    assert.ok(e.merchantName, `${sid} has no merchant name`);
    assert.ok(e.savings && e.loyalty && e.insight && e.offer, `${sid} is missing a section`);
  }
});

test("getDemoEnrichment: the two demos carry DIFFERENT sections", () => {
  // The consumer demo gets the coupon CTA; the merchant demo gets the email
  // opt-in. Every field being optional is what lets one payload type serve
  // both without either carrying a field it has no use for.
  assert.equal(getDemoEnrichment(CONSUMER_SID)?.emailOptIn, undefined);
  assert.ok(getDemoEnrichment(MERCHANT_SID)?.emailOptIn);
  assert.equal(getDemoEnrichment(CONSUMER_SID)?.offer?.minimumBasket, undefined);
  assert.equal(getDemoEnrichment(MERCHANT_SID)?.offer?.minimumBasket, 75);
});

test("getDemoEnrichment: a NON-demo sid resolves to nothing at all", () => {
  // The load-bearing negative. A real customer's receipt must never pick up
  // another shopper's savings, points or price history.
  assert.equal(getDemoEnrichment(PRODUCTION_SID), undefined);
  assert.equal(getDemoEnrichment("not-a-sid"), undefined);
  assert.equal(getDemoEnrichment(""), undefined);
  assert.equal(getDemoEnrichment(undefined), undefined);
  assert.equal(getDemoEnrichment(null), undefined);
  assert.equal(getDemoEnrichment(CONSUMER_SID.toUpperCase()), undefined);
  assert.equal(getDemoEnrichment("5ca1e00000000002"), undefined);
});

test("getDemoEnrichment: a demo sid with NO enrichment is {} , not undefined", () => {
  // Different answers to different questions: "this is a demo receipt with
  // nothing to add" vs "this is not a demo receipt". The bench tag is the
  // former, and the page renders bare paper for it.
  assert.deepEqual(getDemoEnrichment(DEMO_SID), {});
  assert.equal(isEnrichmentEmpty(getDemoEnrichment(DEMO_SID)), true);
  assert.equal(isEnrichmentEmpty(getDemoEnrichment(CONSUMER_SID)), false);
  assert.equal(isEnrichmentEmpty(undefined), true);
});

test("DEMO_SIDS is exactly the registry's keys", () => {
  assert.equal(DEMO_SIDS.size, DEMO_RECEIPTS.size);
  for (const sid of DEMO_RECEIPTS.keys()) assert.equal(DEMO_SIDS.has(sid), true);
});

test("both Tech Week sids are demo sids and render on the demo route", () => {
  for (const sid of [CONSUMER_SID, MERCHANT_SID]) {
    assert.equal(isDemoSid(sid), true);
    assert.deepEqual(resolveDemoRoute(sid), { action: "render", sid });
  }
});

// ---- Arithmetic: the figures against themselves ------------------------------

test("savings: the components sum to the stated total, to the cent", () => {
  // Checked in integer cents. 7 + 1.5 + 2.99 is 11.489999999999998 in IEEE-754
  // and an === against 11.49 would fail for the wrong reason.
  for (const [sid, e] of DEMO_RECEIPTS) {
    if (!e.savings) continue;
    assert.equal(savingsComponentsMatchTotal(e.savings), true, `${sid}: components do not sum to the total`);
  }
  assert.equal(getDemoEnrichment(CONSUMER_SID)?.savings?.total, 11.49);
  assert.equal(getDemoEnrichment(MERCHANT_SID)?.savings?.total, 4.0);
});

test("savings: a wrong component is caught", () => {
  // Proves the check above is load-bearing rather than vacuously true.
  assert.equal(
    savingsComponentsMatchTotal({ total: 11.49, components: [{ label: "x", amount: 11.5 }] }),
    false,
  );
});

test("loyalty: the balance floor-divides to the stated worth", () => {
  // Rungs, not a linear rate: 1,240 points at 100-per-$2 is worth $24 and
  // leaves 40 points on the card. Rounding that up is exactly the sort of
  // small lie the one person doing arithmetic in the room will catch.
  for (const [sid, e] of DEMO_RECEIPTS) {
    if (!e.loyalty) continue;
    assert.equal(
      loyaltyBalanceValue(e.loyalty),
      e.loyalty.balanceValue,
      `${sid}: stated worth disagrees with balance / rate`,
    );
  }
  assert.equal(loyaltyBalanceValue(getDemoEnrichment(CONSUMER_SID)!.loyalty!), 24);
  assert.equal(loyaltyBalanceValue(getDemoEnrichment(MERCHANT_SID)!.loyalty!), 10);
});

test("loyalty: nextRewardAt is the next rung strictly above the balance", () => {
  for (const [sid, e] of DEMO_RECEIPTS) {
    if (!e.loyalty) continue;
    assert.equal(loyaltyNextRung(e.loyalty), e.loyalty.nextRewardAt, `${sid}: next rung is wrong`);
    assert.ok(e.loyalty.nextRewardAt > e.loyalty.pointsBalance, `${sid}: next rung is not ahead`);
  }
  assert.equal(loyaltyPointsToNext(getDemoEnrichment(CONSUMER_SID)!.loyalty!), 60);
  assert.equal(loyaltyPointsToNext(getDemoEnrichment(MERCHANT_SID)!.loyalty!), 20);
});

test("loyalty: the progress bar measures the CURRENT rung, not the balance", () => {
  // 1,240 of 1,300 as a fraction is 95% and would tell the shopper she is
  // nearly there about a 60-point gap. 40 points into a 100-point rung is
  // 40%, which is the same fact without the flattery.
  assert.equal(loyaltyRungProgress(getDemoEnrichment(CONSUMER_SID)!.loyalty!), 0.4);
  assert.equal(loyaltyRungProgress(getDemoEnrichment(MERCHANT_SID)!.loyalty!), 0.9);
});

test("insight: the evidence is internally ordered and meets the 3-observation floor", () => {
  // The production rule this shape exists to make expressible: never state a
  // comparison from fewer than three observations. And "your lowest price
  // yet" is only true if today beats the previous best, which beats nothing
  // if the previous best is above the typical price.
  for (const [sid, e] of DEMO_RECEIPTS) {
    if (!e.insight) continue;
    const v = e.insight.evidence;
    assert.ok(v.observations >= 3, `${sid}: too few observations to make a claim`);
    assert.ok(v.windowMonths > 0, `${sid}: no look-back window`);
    assert.ok(v.pricePaidHere < v.previousBest, `${sid}: today is not a new best`);
    assert.ok(v.previousBest < v.typicalPrice, `${sid}: previous best is not below typical`);
  }
});

test("insight: derived deltas are exact to the cent", () => {
  // 24.49 - 20.99 is 3.5000000000000018 in IEEE-754.
  const c = getDemoEnrichment(CONSUMER_SID)!.insight!.evidence;
  assert.equal(moneyDelta(c.typicalPrice, c.pricePaidHere), 3.5);
  assert.equal(moneyDelta(c.previousBest, c.pricePaidHere), 2.5);
  const m = getDemoEnrichment(MERCHANT_SID)!.insight!.evidence;
  assert.equal(moneyDelta(m.typicalPrice, m.pricePaidHere), 3.0);
  assert.equal(moneyDelta(m.previousBest, m.pricePaidHere), 1.5);
});

// ---- Insight copy: templates, never re-typed figures -------------------------

test("insight copy: every seeded template renders with no token left behind", () => {
  // The guard that lets renderInsightCopy leave an unknown token verbatim
  // instead of throwing. A throw inside a server component is a 500, and a
  // 500 at a booth is worse than a visible typo — so the typo is caught here,
  // where it costs nothing.
  for (const [sid, e] of DEMO_RECEIPTS) {
    if (!e.insight) continue;
    for (const [which, tpl] of [["headline", e.insight.headline], ["body", e.insight.body]] as const) {
      const out = renderInsightCopy(tpl, e.insight.evidence, e.merchantName);
      assert.ok(!out.includes("{"), `${sid}: unsubstituted token in ${which}: ${out}`);
      assert.ok(!out.includes("}"), `${sid}: stray brace in ${which}: ${out}`);
    }
  }
});

test("insight copy: the figures in the prose come from the evidence", () => {
  const e = getDemoEnrichment(MERCHANT_SID)!;
  assert.equal(
    renderInsightCopy(e.insight!.headline, e.insight!.evidence, e.merchantName),
    "Ellsworth Market came in $3.00 under your usual Tide price.",
  );
  const consumer = getDemoEnrichment(CONSUMER_SID)!;
  assert.equal(
    renderInsightCopy(consumer.insight!.headline, consumer.insight!.evidence, consumer.merchantName),
    "You just paid your lowest price yet on Bounty.",
  );
  // Change the evidence and the prose follows it — this is the whole reason
  // the copy is a template rather than a finished sentence.
  assert.equal(
    renderInsightCopy(e.insight!.headline, { ...e.insight!.evidence, pricePaidHere: 14.99 }, e.merchantName),
    "Ellsworth Market came in $4.00 under your usual Tide price.",
  );
});

test("insight copy: an unknown token survives rather than throwing", () => {
  const v = getDemoEnrichment(CONSUMER_SID)!.insight!.evidence;
  assert.equal(renderInsightCopy("a {nope} b {sku}", v), "a {nope} b Bounty Select-A-Size 12=24");
});

test("insight copy: a missing merchant name still yields a whole sentence", () => {
  const e = getDemoEnrichment(MERCHANT_SID)!;
  assert.equal(
    renderInsightCopy(e.insight!.headline, e.insight!.evidence, undefined),
    "this store came in $3.00 under your usual Tide price.",
  );
});

test("insight: the evidence rows carry the same figures as the prose", () => {
  const rows = insightEvidenceRows(getDemoEnrichment(CONSUMER_SID)!.insight!.evidence);
  assert.deepEqual(rows, [
    { label: "Purchases", value: "6 in the last 12 months" },
    { label: "You usually pay", value: "$24.49" },
    { label: "Your previous best", value: "$23.49" },
    { label: "Today, here", value: "$20.99" },
  ]);
});

// ---- The offer: relative expiry, checked at simulated dates -------------------

test("offer validity states a DURATION and never a date", () => {
  // The line that has to survive a tap in March. No year, no month name, no
  // "expired" — a pure function of the window length, with no clock in it.
  const consumer = getDemoEnrichment(CONSUMER_SID)!.offer!;
  const merchant = getDemoEnrichment(MERCHANT_SID)!.offer!;
  assert.equal(formatOfferValidity(consumer), "Valid for 60 days from purchase");
  assert.equal(formatOfferValidity(merchant), "Valid for 14 days from purchase");
  for (const [sid, e] of DEMO_RECEIPTS) {
    if (!e.offer) continue;
    const line = formatOfferValidity(e.offer);
    assert.ok(!/\d{4}/.test(line), `${sid}: validity line contains a year: ${line}`);
    assert.ok(
      !/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(line),
      `${sid}: validity line contains a month: ${line}`,
    );
    assert.ok(!/expir/i.test(line), `${sid}: validity line says "expire": ${line}`);
  }
  assert.equal(formatOfferValidity({ ...merchant, validForDays: 1 }), "Valid for 1 day from purchase");
});

test("offer window: the consumer coupon counts down from its own receipt date", () => {
  // Receipt printed 2026-09-30, 60-day window -> the last day is 2026-11-29.
  const e = getDemoEnrichment(CONSUMER_SID);
  assert.equal(offerDaysRemaining(e, at("2026-09-30")), 60); // the day of purchase
  assert.equal(offerDaysRemaining(e, at("2026-10-05")), 55); // SF Tech Week opens
  assert.equal(offerDaysRemaining(e, at("2026-10-18")), 42); // LA Tech Week closes
  assert.equal(offerDaysRemaining(e, at("2026-11-28")), 1);
  assert.equal(offerDaysRemaining(e, at("2026-11-29")), 0); // the last day
});

test("offer window: the merchant coupon counts down from its own receipt date", () => {
  // Receipt printed 2026-09-29, 14-day window -> the last day is 2026-10-13.
  const e = getDemoEnrichment(MERCHANT_SID);
  assert.equal(offerDaysRemaining(e, at("2026-09-29")), 14);
  assert.equal(offerDaysRemaining(e, at("2026-10-08")), 5);
  assert.equal(offerDaysRemaining(e, at("2026-10-12")), 1);
  assert.equal(offerDaysRemaining(e, at("2026-10-13")), 0);
});

test("offer window: PAST the window the chip vanishes — it never says Expired", () => {
  // The permanent-sticker case, and the single most important assertion in
  // this file. Somebody taps a table sticker in March 2027 and the page shows
  // a voucher that says "Valid for 60 days from purchase" with no chip and no
  // dead date — an old receipt, not broken software.
  const consumer = getDemoEnrichment(CONSUMER_SID);
  const merchant = getDemoEnrichment(MERCHANT_SID);
  for (const day of ["2026-11-30", "2026-12-25", "2027-03-14", "2028-01-01", "2031-07-04"]) {
    assert.equal(offerDaysRemaining(consumer, at(day)), null, `consumer chip still shown on ${day}`);
  }
  for (const day of ["2026-10-14", "2026-12-25", "2027-06-01", "2030-01-01"]) {
    assert.equal(offerDaysRemaining(merchant, at(day)), null, `merchant chip still shown on ${day}`);
  }
});

test("offer window: the day boundary is UTC on both sides, DST-proof", () => {
  // (a - b) / 86_400_000 across a DST change is not an integer in local time,
  // and the countdown would flip a day early or late depending on where the
  // render happened to run. US DST ended 2026-11-01, inside the 60-day
  // window; these assertions straddle it and the last-day boundary.
  const e = getDemoEnrichment(CONSUMER_SID);
  assert.equal(offerDaysRemaining(e, new Date("2026-11-01T00:00:00Z")), 28);
  assert.equal(offerDaysRemaining(e, new Date("2026-11-01T23:59:59Z")), 28);
  assert.equal(offerDaysRemaining(e, new Date("2026-11-29T00:00:00Z")), 0);
  assert.equal(offerDaysRemaining(e, new Date("2026-11-29T23:59:59Z")), 0);
  assert.equal(offerDaysRemaining(e, new Date("2026-11-30T00:00:01Z")), null);
});

test("offer window: a clock set before the receipt shows the full window", () => {
  // A wrong device date must not produce a countdown longer than the offer.
  const e = getDemoEnrichment(CONSUMER_SID);
  assert.equal(offerDaysRemaining(e, at("2026-09-29")), 60);
  assert.equal(offerDaysRemaining(e, at("2001-01-01")), 60);
});

test("offer window: no offer, or no anchor date, shows no chip", () => {
  assert.equal(offerDaysRemaining(undefined, at("2026-10-05")), null);
  assert.equal(offerDaysRemaining({}, at("2026-10-05")), null);
  const e = getDemoEnrichment(MERCHANT_SID)!;
  assert.equal(offerDaysRemaining({ offer: e.offer }, at("2026-10-05")), null);
  assert.equal(
    offerDaysRemaining({ offer: e.offer, receiptDate: "29/09/2026" }, at("2026-10-05")),
    null,
  );
});

test("offer window: every seeded offer has an anchor to count down from", () => {
  for (const [sid, e] of DEMO_RECEIPTS) {
    if (!e.offer) continue;
    assert.ok(e.receiptDate, `${sid}: offer with no receiptDate anchor`);
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(e.receiptDate!), `${sid}: receiptDate is not YYYY-MM-DD`);
  }
});

test("formatDaysRemaining: reads correctly at every boundary", () => {
  assert.equal(formatDaysRemaining(0), "Last day");
  assert.equal(formatDaysRemaining(1), "1 day left");
  assert.equal(formatDaysRemaining(2), "2 days left");
  assert.equal(formatDaysRemaining(60), "60 days left");
});

// ---- Offer copy --------------------------------------------------------------

test("offer copy: the sentence and the qualifier come from the figures", () => {
  const consumer = getDemoEnrichment(CONSUMER_SID)!;
  assert.equal(
    formatOfferSentence(consumer.offer!, consumer.merchantName),
    "$4 off Bounty Select-A-Size 12=24 at Hartwell's Market.",
  );
  // "No minimum" is RENDERED, never omitted: it is the term a shopper looks
  // for first, and a blank space reads as a catch not yet found.
  assert.equal(formatOfferQualifier(consumer.offer!), "No minimum");

  const merchant = getDemoEnrichment(MERCHANT_SID)!;
  assert.equal(
    formatOfferSentence(merchant.offer!, merchant.merchantName),
    "$10 off your next purchase of $75 or more at Ellsworth Market.",
  );
  assert.equal(formatOfferQualifier(merchant.offer!), "On $75+");
});

test("offer copy: the merchant demo carries its limit and its exclusions", () => {
  const offer = getDemoEnrichment(MERCHANT_SID)!.offer!;
  assert.equal(offer.limit, "Limit one per customer");
  assert.ok(offer.exclusions?.includes("alcohol"));
  assert.equal(getDemoEnrichment(CONSUMER_SID)!.offer!.limit, "Limit one per household");
  assert.equal(getDemoEnrichment(CONSUMER_SID)!.offer!.exclusions, undefined);
});

test("every seeded offer names a CTA", () => {
  for (const [sid, e] of DEMO_RECEIPTS) {
    if (!e.offer) continue;
    assert.ok(e.offer.ctaLabel.length > 0, `${sid}: offer has no CTA label`);
  }
});

// ---- The email opt-in --------------------------------------------------------

test("email opt-in: names the recipient and the purpose, and shows no address", () => {
  // The strongest consent record of the drafted variants, and the one thing a
  // shared demo phone must never do is surface somebody's real address.
  const optIn = getDemoEnrichment(MERCHANT_SID)!.emailOptIn!;
  assert.ok(optIn.label.includes("Ellsworth Market"));
  assert.ok(/off any time in PapeX/i.test(optIn.subLabel));
  for (const [sid, e] of DEMO_RECEIPTS) {
    if (!e.emailOptIn) continue;
    const text = `${e.emailOptIn.label} ${e.emailOptIn.subLabel}`;
    assert.ok(!/@/.test(text), `${sid}: opt-in copy contains an address-shaped string`);
  }
});

// ---- Loyalty language --------------------------------------------------------

test("the loyalty disclosure never implies PapeX redeems or holds value", () => {
  // The guardrail that keeps this clear of stored-value territory and of a
  // promise we cannot keep at somebody else's register. Do not cut it.
  assert.equal(LOYALTY_DISCLOSURE, "PapeX tracks your points. Redeem them at the register like always.");
});

// ---- Formatters --------------------------------------------------------------

test("formatters: money, points and counts", () => {
  assert.equal(formatMoney(11.49), "$11.49");
  assert.equal(formatMoney(4), "$4.00");
  assert.equal(formatMoneyCompact(10), "$10");
  assert.equal(formatMoneyCompact(3.5), "$3.50");
  assert.equal(formatPoints(1240), "1,240");
  assert.equal(formatPoints(96), "96");
  assert.equal(formatCountWord(6), "six");
  assert.equal(formatCountWord(5), "five");
  assert.equal(formatCountWord(42), "42");
});

// ---- The payload is a production seam, not a fixture -------------------------

test("the payload is plain JSON — an HTTP response could carry it unchanged", () => {
  // The property that makes swapping this map for a fetch a one-file change:
  // no functions, no Dates, no class instances anywhere in the tree. This is
  // also why the insight copy is a template string and not a closure.
  for (const [sid, e] of DEMO_RECEIPTS) {
    assert.deepEqual(JSON.parse(JSON.stringify(e)), e, `${sid}: payload does not survive a JSON round-trip`);
  }
});

// ---- Summary -----------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
