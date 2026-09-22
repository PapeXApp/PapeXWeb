// lib/cards/demoSource.ts
//
// The demo value layer, projected into resolved cards (format v1).
//
// This stands in for the P1 cards service on the demo routes. It takes the
// compiled enrichment registry in lib/demoReceipts.ts and produces exactly
// what `GET /receipt/{sid}/cards` will return for these sids: the finished
// card list, every template rendered, every figure formatted. The page runs
// it through the same normalizer and renderer a fetched response will go
// through, so when P1 lands the swap is one call site and nothing
// downstream of it changes.
//
// EACH ENRICHMENT SECTION MAPS ONTO EXACTLY ONE CARD TYPE (the P0
// acceptance check in the design):
//   fabricated  → disclosure      savings → savings    loyalty → loyalty
//   insight     → insight         offer   → offer      emailOptIn → emailCapture
// in the order the page has always drawn them. Nothing about the demo is
// special-cased in the renderer; it is just the first config.
//
// WHAT THIS DOES NOT OWN
//   The offer's anchor date. How many days a voucher has left is decided by
//   `offerDaysRemaining` in lib/demoReceipts.ts (which the dateline-anchor
//   fix is changing), and the page passes that number in. This module only
//   turns it into the `expiresAt` instant the card format carries, using the
//   countdown rule in ./countdown.ts, so the chip the renderer computes back
//   out of it is the same number, byte for byte.
//
// Kept until the P1 service serves these sids (design: through Oct 18, LA
// Tech Week), then deleted together with app/r/enrichment.tsx.

import {
  type DemoReceiptEnrichment,
  LOYALTY_DISCLOSURE,
  formatDemoDisclosure,
  formatMoney,
  formatMoneyCompact,
  formatOfferQualifier,
  formatOfferSentence,
  formatOfferValidity,
  formatPoints,
  getDemoEnrichment,
  insightEvidenceRows,
  loyaltyPointsToNext,
  loyaltyRungProgress,
  renderInsightCopy,
} from "@/lib/demoReceipts";
import { endOfUtcDayAfter } from "./countdown";
import { CARDS_SCHEMA_VERSION, type Card, type ResolvedCards } from "./types";

/**
 * Demo merchants that are PapeX PARTNERS, by sid. Email capture is
 * partner-only, so this literal list, not the presence of an opt-in in the
 * registry, decides whether the capture card may exist at all. Ellsworth
 * Market is the (invented) partner in the merchant pitch.
 */
export const DEMO_PARTNER_SIDS: ReadonlySet<string> = new Set(["b0de9a0000000001"]);

/** The consent text id the demo's inert opt-in stands for. A demo id; no real consent text lives in this public repo. */
const DEMO_CONSENT_TEXT_ID = "demo-share-email";

export interface DemoCardsClock {
  now: Date;
  /** From `offerDaysRemaining(...)` in lib/demoReceipts.ts. Null hides the countdown chip. */
  offerDaysRemaining: number | null;
}

/**
 * The resolved cards for a demo sid, or `undefined` for any sid that is not
 * one (the demo routes redirect those to `/r` before getting here).
 */
export function demoResolvedCards(sid: string, clock: DemoCardsClock): ResolvedCards | undefined {
  const enrichment = getDemoEnrichment(sid);
  if (!enrichment) return undefined;
  const partner = DEMO_PARTNER_SIDS.has(sid);
  const cards = projectDemoEnrichment(enrichment, clock, partner);
  return {
    schemaVersion: CARDS_SCHEMA_VERSION,
    sid,
    status: cards.length > 0 ? "ok" : "none",
    configRef: "demo-registry",
    merchant: { partner, ageRestricted: false },
    cards,
  };
}

/**
 * One enrichment payload as cards, in page order. Exported for the tests,
 * which also feed it payloads the registry doesn't hold (an opt-in on a
 * non-partner) to prove the resolver-side partner rule.
 */
export function projectDemoEnrichment(e: DemoReceiptEnrichment, clock: DemoCardsClock, partner: boolean): Card[] {
  const cards: Card[] = [];
  const merchantName = e.merchantName;

  const disclosure = formatDemoDisclosure(e);
  if (disclosure) {
    cards.push({ id: "demo-disclosure", type: "disclosure", mode: "preview", text: disclosure });
  }

  if (e.savings) {
    cards.push({
      id: "demo-savings",
      type: "savings",
      mode: "preview",
      heading: "Savings",
      total: formatMoney(e.savings.total),
      totalLabel: "saved today",
      ...(e.savings.components.length > 0
        ? { components: e.savings.components.map((c) => ({ label: c.label, amount: formatMoney(c.amount) })) }
        : {}),
    });
  }

  if (e.loyalty) {
    const l = e.loyalty;
    cards.push({
      id: "demo-loyalty",
      type: "loyalty",
      mode: "preview",
      heading: "Rewards",
      programName: l.programName,
      earned: `+${formatPoints(l.pointsEarned)} pts`,
      balance: { value: formatPoints(l.pointsBalance), label: "points" },
      balanceWorth: `worth ${formatMoneyCompact(l.balanceValue)}`,
      progress: {
        fraction: loyaltyRungProgress(l),
        text:
          `${formatPoints(loyaltyPointsToNext(l))} points from your next ${formatMoneyCompact(l.rewardValue)} reward ` +
          `(${formatPoints(l.nextRewardAt)} pts).`,
      },
      note: LOYALTY_DISCLOSURE,
    });
  }

  if (e.insight) {
    const i = e.insight;
    cards.push({
      id: "demo-insight",
      type: "insight",
      mode: "preview",
      heading: "A message from PapeX",
      kicker: "From your own receipts",
      headline: renderInsightCopy(i.headline, i.evidence, merchantName),
      body: renderInsightCopy(i.body, i.evidence, merchantName),
      evidence: insightEvidenceRows(i.evidence),
      footnote: "Compared against the identical pack only, from receipts you captured.",
    });
  }

  if (e.offer) {
    const o = e.offer;
    cards.push({
      id: "demo-offer",
      type: "offer",
      mode: "preview",
      heading: merchantName ? `An offer from ${merchantName}` : "An offer for you",
      kicker: "Next visit",
      valueLabel: formatMoneyCompact(o.discount),
      valueSuffix: "off",
      qualifier: formatOfferQualifier(o),
      title: formatOfferSentence(o, merchantName),
      terms: `${formatOfferValidity(o)}. ${o.limit}.${o.exclusions ? ` ${o.exclusions}` : ""}`,
      ...(clock.offerDaysRemaining != null
        ? { validity: { expiresAt: endOfUtcDayAfter(clock.now, clock.offerDaysRemaining), countdown: true } }
        : {}),
      // The voucher's printed action line. Inert on every surface in P0, and
      // a demo can never offer a claim anyway (single owner per sid).
      actions: [{ type: "save", label: o.ctaLabel }],
    });
  }

  // PARTNER-ONLY. A registry opt-in on a non-partner sid produces no card:
  // the resolver, not the renderer, is where eligibility is decided first.
  if (e.emailOptIn && partner) {
    cards.push({
      id: "demo-email-capture",
      type: "emailCapture",
      mode: "preview",
      kicker: "Stay in touch",
      consentLabel: e.emailOptIn.label,
      consentNote: e.emailOptIn.subLabel,
      consent: { textId: DEMO_CONSENT_TEXT_ID, textVersion: 1 },
    });
  }

  return cards;
}
