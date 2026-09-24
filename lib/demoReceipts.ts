// lib/demoReceipts.ts
//
// The demo-receipt registry: which RDH session ids are Tech Week / booth
// demo receipts rather than somebody's real purchase, and — for the ones
// that carry one — the PapeX enrichment layer rendered on top of the paper.
//
// WHAT THIS IS FOR
//   A demo NFC tag must never offer an action that can fail. Claiming an RDH
//   receipt is single-owner-per-sid (papex-adapter-backend/src/api/rdh.js
//   reads `scanned_receipts/rdh_<sid>` BEFORE the backend fetch and
//   short-circuits to 409 `claimed_by_other` for a foreign userId), so the
//   second stranger to press "Save to PapeX" on a demo tag is told the
//   receipt "was already saved by another account". Nothing else breaks —
//   `/receipt/{sid}` and `/receipt/{sid}/parsed` are untouched by a claim, so
//   the receipt still renders identically forever — but that one message is
//   the worst possible sentence to put in front of a conference audience.
//   The fix is to not offer the button. Everything in this module exists to
//   answer exactly one question: "is it safe to offer Save for this sid?"
//
// WHY A LITERAL ALLOWLIST, AND NOT A PREFIX / REGEX / MERCHANT LOOKUP
//   1. A literal map of chosen constants is reviewable. There is no rule to
//      mis-scope: a sid is a demo sid if and only if somebody typed it into
//      the block below and got it through review. A prefix or a regex, by
//      contrast, describes a *space* of sids, and the failure mode of a
//      mis-scoped space is that demo semantics silently start applying to a
//      live merchant's customers.
//   2. Production sids cannot collide with it. The upload Lambda mints them
//      with `randomBytes(8).toString("hex")` (Papex_RDH/lambdas/upload/
//      handler.js), so the chance a real device ever mints one of these
//      chosen constants is ~5e-20 per receipt.
//   3. Demo sids are minted out-of-band. They are written straight to S3 by
//      the demo-tag generator, bypassing `POST /upload` precisely so the
//      value can be *chosen*. They live in a namespace no device can reach by
//      policy, not merely by probability.
//   4. A merchant-id rule is not available here even if we wanted one.
//      `GET /receipt/{sid}/parsed` (Papex_RDH/lambdas/fetch/handler.js
//      `toReceipt()`) is an explicit allow-list of output fields and
//      deliberately OMITS `merchant_id` and `device_id` — "the read path is
//      anonymous by design". A `demo-` merchant prefix check would require
//      adding merchant identity to an unauthenticated endpoint to power a
//      demo flag, which is a bad trade.
//   5. The failure direction is safe. Membership only ever REMOVES the Save
//      button. A false positive costs a button; it can never fabricate
//      content, swap a merchant, or show one customer another's receipt.
//
// WHAT THIS DOES **NOT** COVER — read this before relying on it
//   The App Clip's own "Save to PapeX" button lives in the shipped iOS
//   binary and cannot be changed from this repo. PapeXClip's ReceiptViewModel
//   always renders it and always points it at
//   `https://links.papex.app/rdh?sid=…`, which the INSTALLED full app claims
//   directly against the adapter — bypassing PapeXWeb, this file, and
//   app/api/rdh/claim/route.ts entirely. So:
//     - stranger with no PapeX app   -> Save opens the App Store. No claim.
//       Safe, and this is the Tech Week common case.
//     - someone who already has the app -> Save claims it. ONE person can
//       still burn a demo sid this way, and no web-layer change can stop it.
//   Mitigations are operational, not code: rotate the demo sid per event day
//   (one NFC Tools rewrite), use one sid per tag so a burned sid costs one
//   tag rather than the demo, or delete `scanned_receipts/rdh_<sid>` in the
//   papexv2 Firebase console. The permanent fix is a per-sid exemption in the
//   adapter's claim handler; that needs an adapter deploy and is deliberately
//   out of scope here.
//
//   Also not covered: this module says nothing about which *route* was used.
//   The route decides which iOS experience fires; this allowlist decides
//   whether the sid is claimable. They answer different questions and both
//   are needed — a demo sid reached through a stale `/r?sid=` URL must still
//   be claim-safe, and a production sid pasted into `/r/demo?sid=` must still
//   behave exactly like production.
//
// Pure and dependency-free (beyond `isValidSid`) so it can be unit-tested via
// this repo's tsx-script pattern — see lib/demoReceipts.test.ts, run with
// `npm run test:demo`.

import { isValidSid } from "./rdh";

// =============================================================================
// THE ENRICHMENT PAYLOAD
// =============================================================================
//
// This is deliberately shaped as the thing a real enrichment SERVICE would
// return for a receipt — not as a bag of demo strings. The demo is the first
// caller, not the reason the type exists.
//
// Three properties make it a seam rather than a fixture:
//
//   1. EVERY SECTION IS OPTIONAL. A real service will know the savings on one
//      receipt, the loyalty balance on another and nothing at all on a third.
//      The consumer demo carries a coupon and no email opt-in; the merchant
//      demo carries an opt-in and a basket-minimum offer. Neither is a
//      special case — each just fills in what it has.
//
//   2. IT IS PLAIN JSON. No functions, no Dates, no class instances. A
//      payload that can survive `JSON.parse(JSON.stringify(x))` unchanged is
//      a payload an HTTP response can carry, which is what makes the swap
//      from this map to a fetch a one-file change rather than a call-site
//      migration. (This is why the insight's copy is stored as TEMPLATES and
//      not as closures — see DemoInsight.)
//
//   3. NUMBERS ARE NUMBERS. Every figure the UI shows is stored as a number
//      and formatted at the edge. Copy changes weekly before an event;
//      figures do not. Baking "$3.50 under what you usually pay" into a
//      string means the prose and the evidence can drift apart silently, and
//      a price claim that disagrees with its own supporting data is the one
//      defect this block genuinely cannot afford (it is a factual claim about
//      a person — see the risk notes in the demo content doc).
//
// Money is a plain `number` of dollars throughout, because every consumer of
// it either formats it or compares it, and there is no arithmetic here deep
// enough to need cents-as-integers. The one place float error is visible —
// summing the savings components — is handled by comparing rounded cents; see
// `savingsComponentsMatchTotal`.

/** One promoted line on the receipt, and what it took off the price. */
export interface DemoSavingsComponent {
  /** As the shopper would name it, not as the printer abbreviated it. */
  label: string;
  /** Dollars taken off this line. */
  amount: number;
}

/**
 * What this basket saved, and where the saving came from.
 *
 * The composition is not decoration. An unbroken "$11.49" reads like
 * marketing; three itemised components read like a ledger, and a ledger is
 * what makes the number believable in a room full of people who are deciding
 * whether to believe the rest of the pitch.
 */
export interface DemoSavings {
  total: number;
  components: DemoSavingsComponent[];
}

/**
 * The merchant's loyalty programme, as of this receipt.
 *
 * `pointsPerReward` / `rewardValue` are carried as a pair rather than as a
 * pre-computed "points are worth N cents each" rate because real grocery
 * programmes are rung-based, not linear: 1,240 points at 100-per-$2 is worth
 * $24, not $24.80. Storing the rungs lets `loyaltyBalanceValue()` do the
 * floor division the register would do, and lets the test check the seeded
 * `balanceValue` against it instead of trusting a typed-in number.
 *
 * NOTE ON COPY: nothing rendered from this may imply PapeX redeems points or
 * holds value on the shopper's behalf. That edges toward stored-value
 * territory and toward a promise we cannot keep at someone else's register.
 * `LOYALTY_DISCLOSURE` below is the guardrail and is not optional.
 */
export interface DemoLoyalty {
  /** The merchant's name for it — "Hartwell's Rewards". */
  programName: string;
  /** Points minted by this receipt. */
  pointsEarned: number;
  /** Points on the card after this receipt. */
  pointsBalance: number;
  /** What the balance is worth today, in dollars, at the register. */
  balanceValue: number;
  /** Points in one reward rung. */
  pointsPerReward: number;
  /** Dollars one rung is worth. */
  rewardValue: number;
  /** The next rung above the current balance, in points. */
  nextRewardAt: number;
}

/**
 * The figures behind a price insight. This — not the prose — is the claim.
 *
 * Production rule this shape exists to make expressible: never state a
 * comparison from fewer than three observations, and never from a modelled or
 * estimated price. `observations` is therefore a required field, not a
 * flourish, and the comparison is always the shopper against their own
 * history — never this store against another store.
 */
export interface DemoInsightEvidence {
  /** The full pack spec, exactly as compared: "Bounty Select-A-Size 12=24". */
  skuLabel: string;
  /** The brand alone, for headline copy: "Bounty". */
  skuShortLabel: string;
  /** How many times the shopper bought this exact pack in the window. */
  observations: number;
  /** The look-back window, in months. */
  windowMonths: number;
  /** What they usually pay for it. */
  typicalPrice: number;
  /** The lowest they had paid for it before today. */
  previousBest: number;
  /** What they paid for it on this receipt. */
  pricePaidHere: number;
}

/**
 * PapeX's own observation about this basket — the one beat of the demo that
 * nobody else has.
 *
 * `headline` and `body` are TEMPLATES, not finished sentences: `{typical}`,
 * `{savedVsTypical}` and friends are substituted from `evidence` by
 * `renderInsightCopy()`. That indirection is the point. The wording of this
 * block is expected to change many times before an event and to be A/B'd
 * after one; the figures inside it must never be re-typed by hand when it
 * does. A template also keeps the payload JSON-serialisable, which a closure
 * would not.
 *
 * See INSIGHT_TOKENS for the full vocabulary. An unknown token renders
 * verbatim rather than throwing — a 500 at a booth is worse than a visible
 * typo — and the test suite asserts that no seeded template leaves one
 * behind, so it cannot ship.
 */
export interface DemoInsight {
  headline: string;
  body: string;
  evidence: DemoInsightEvidence;
}

/**
 * The merchant's offer, printed as a voucher.
 *
 * ---------------------------------------------------------------------------
 * WHY THE WINDOW IS IN DAYS AND THERE IS NO `expiresAt`
 * ---------------------------------------------------------------------------
 * The NFC stickers are PERMANENT. The receipt behind them is a fixed blob
 * with a fixed printed date, and the sticker on the table in October is the
 * same sticker somebody taps in March.
 *
 * An absolute expiry date — "Expires Nov 29, 2026" — is therefore guaranteed
 * to go stale, and a demo advertising a dead coupon does not read as an old
 * receipt. It reads as broken software, which is the single worst thing a
 * prospect can conclude while holding your product.
 *
 * So the window is stored as a DURATION and the voucher states it as one:
 * "Valid for 60 days from purchase" is true on every date there will ever be.
 * The receipt's own date (`DemoReceiptEnrichment.receiptDate`) is the anchor
 * for the optional urgency chip only, and that chip DISAPPEARS once the
 * window has closed rather than flipping to "Expired" — see
 * `offerDaysRemaining()`. Nothing on the page can ever say a false thing
 * about time.
 *
 * A real, non-demo offer for a real, fresh receipt would carry an absolute
 * `expiresAt` and should. The relative form is correct here because the
 * artefact is permanent, not because durations are better.
 * ---------------------------------------------------------------------------
 */
export interface DemoOffer {
  /** Dollars off. */
  discount: number;
  /**
   * Dollars the qualifying basket must reach. ABSENT MEANS NO MINIMUM, and
   * the voucher says so out loud — "no minimum purchase" is the single most
   * consumer-friendly term available and the one a shopper notices first, so
   * it is worth a rendered line rather than a silent omission.
   */
  minimumBasket?: number;
  /** What the discount is against, when it is item-specific. */
  appliesTo?: string;
  /** The window, in days. Never an absolute date — see the block above. */
  validForDays: number;
  /** "Limit one per household" / "Limit one per customer". */
  limit: string;
  /** The exclusion list, verbatim, when there is one. */
  exclusions?: string;
  /** The action the voucher names. See the note in app/r/enrichment.tsx. */
  ctaLabel: string;
}

/**
 * The "share my email with the merchant" consent control.
 *
 * Unchecked by default and inert, always — see the component. A pre-checked
 * box is a CPRA/CAN-SPAM problem and, more immediately, it is the thing a
 * privacy-literate person in the room will spot and call out, which turns
 * your demo into their demo.
 */
export interface DemoEmailOptIn {
  label: string;
  subLabel: string;
}

/**
 * Everything PapeX knows about one demo receipt beyond the bytes the printer
 * sent. Every field optional; an empty object is a perfectly good value and
 * means "this is a demo sid, and it renders as bare paper".
 */
export interface DemoReceiptEnrichment {
  /**
   * The store, as the enrichment layer names it. Used in copy ("Ellsworth
   * came in $3.00 under…"); the receipt header itself comes from the blob.
   */
  merchantName?: string;
  /**
   * The date printed on the receipt, `YYYY-MM-DD`.
   *
   * This one absolute date is fine — it is the purchase date, it is printed
   * on the paper, and it does not change. It is the ANCHOR the relative offer
   * window is measured from. The expiry is what must never be absolute.
   *
   * THE PAPER IS CANONICAL, NOT THIS FIELD. The blob seeded in S3 is what a
   * phone renders and what the person in the room is holding; this is a
   * transcription of its dateline. When they disagree, this is the side that
   * is wrong — correcting the blob means writing to a live demo sid that
   * physical tags may already point at. `lib/demoBlobParity.test.ts` holds a
   * committed copy of each seeded blob and asserts the two agree.
   */
  receiptDate?: string;
  savings?: DemoSavings;
  loyalty?: DemoLoyalty;
  insight?: DemoInsight;
  offer?: DemoOffer;
  emailOptIn?: DemoEmailOptIn;
  /**
   * True when the STORE, its prices, and its promotions were invented for
   * this demo — as opposed to real seeded data from a real provisioned
   * merchant (the Sunset Leaf bench tag, `5371e4f000000001`, is the latter
   * and carries no `fabricated` flag). Drives a single discreet disclosure
   * line on the demo routes only (`formatDemoDisclosure` below, rendered by
   * `DemoDisclosure` in app/r/ui.tsx) — never on `/r`, and never for a
   * receipt that doesn't set this, so a future demo built from a real
   * provisioned merchant's real seeded data can simply omit it.
   *
   * WHY A FLAG PLUS ONE CANONICAL SENTENCE, NOT FREE TEXT PER RECEIPT
   *   Every other field in this payload is unique to what actually happened
   *   on that basket — that specificity is the whole pitch. This is the
   *   opposite kind of content: boilerplate a careful company keeps worded
   *   identically everywhere it appears, the way a stock-photo caption does.
   *   So the wording lives once, in `formatDemoDisclosure`, and a receipt
   *   author only ever decides yes/no — which is also what keeps Hartwell's
   *   and Ellsworth's disclosures from drifting apart one word at a time.
   *
   * WHY PER-RECEIPT, NOT KEYED OFF `isDemoSid`
   *   The premise is about the DATA, not the ROUTE: Sunset Leaf really did
   *   come off a real till, Hartwell's and Ellsworth did not, and both reach
   *   the visitor through the same demo routes. A blanket "every demo sid
   *   gets a disclosure" rule would mislabel Sunset Leaf as invented; a
   *   blanket "no demo sid gets one" rule is the bug this field exists to
   *   fix. Keying it to the payload — reusing the same registry that already
   *   decides what a sid may show — is what makes both true at once.
   */
  fabricated?: boolean;
}

/**
 * The loyalty guardrail line. Rendered wherever `loyalty` is, and not
 * optional: it is simultaneously the answer to a real objection ("do you take
 * my points?") and what keeps the copy clear of anything that looks like
 * holding stored value on someone else's behalf.
 */
export const LOYALTY_DISCLOSURE = "PapeX tracks your points. Redeem them at the register like always.";

// =============================================================================
// THE REGISTRY
// =============================================================================

/**
 * Every sid that is a demo receipt, mapped to its enrichment payload.
 *
 * RULES FOR EDITING THIS MAP
 *   - Only ever add a sid that was minted out-of-band by the demo-tag
 *     generator. Never add a sid that came from a real device.
 *   - The demo blob must be TEXT ESC/POS, never a Blaze/Star raster. A raster
 *     demo receipt renders as a flat bitmap in the App Clip (the shipped clip
 *     does not read `/parsed`) while the web swaps in structured cards ~46 s
 *     later, which recreates the exact clip-vs-web mismatch the demo is
 *     meant to showcase away.
 *   - Deploy the sid here BEFORE writing it to a tag.
 *   - Every figure below must agree with the figures printed in the blob.
 *     `lib/demoReceipts.test.ts` checks the arithmetic that is checkable from
 *     here alone (components sum to the savings total, the balance
 *     floor-divides to the stated worth, the next rung is the next rung).
 *     `lib/demoBlobParity.test.ts` checks this map against a committed copy of
 *     the seeded ESC/POS itself — dateline, merchant, totals, the savings
 *     line, the loyalty rungs and every discounted price.
 *     That second half used to be a review responsibility, and it was wrong
 *     for six days: the blobs were re-minted on 2026-09-11 onto new printed
 *     dates and this map kept the drafting-era ones, which anchored the
 *     voucher countdown to a date that is not on the paper.
 */
export const DEMO_RECEIPTS: ReadonlyMap<string, DemoReceiptEnrichment> = new Map<
  string,
  DemoReceiptEnrichment
>([
  // ---------------------------------------------------------------------------
  // Sunset Leaf Co. — the permanent bench/booth demo tag (see the RDH demo
  // NFC tag notes). Text ESC/POS, seeded to S3 out-of-band.
  //
  // No enrichment, deliberately: this tag predates the Tech Week story and is
  // used for hardware/bench demos where the point is the tap and the paper,
  // not the value layer. An empty payload is a first-class value — the page
  // renders exactly as it did before this map existed.
  // ---------------------------------------------------------------------------
  ["5371e4f000000001", {}],

  // ---------------------------------------------------------------------------
  // DEMO 1 — THE CONSUMER PITCH.  Hartwell's Market #218, San Mateo, CA.
  // Receipt printed WED 09/02/26 18:42. Subtotal $96.30, tax $3.41, total
  // $99.71 (CA exempts unprepared food; the tax is on the paper towels, the
  // sparkling water, the dish soap and their CRV).
  //
  // The story in two blocks: the insight looks BACKWARD (you got your
  // best-ever price on this pack, here) and the coupon looks FORWARD (here is
  // $4 off the next one) — same SKU, same store. That is the whole pitch, and
  // it does not require narration.
  // ---------------------------------------------------------------------------
  [
    "5ca1e00000000001",
    {
      merchantName: "Hartwell's Market",
      receiptDate: "2026-09-02",
      // Hartwell's Market is invented, and so are every price and promotion
      // below — see DemoReceiptEnrichment.fabricated. Unlike Sunset Leaf,
      // this is not a real provisioned merchant's till.
      fabricated: true,

      savings: {
        total: 11.49,
        components: [
          // 27.99 -> 20.99 (25% off)
          { label: "Bounty Select-A-Size 12=24", amount: 7.0 },
          // 7.99 -> 6.49
          { label: "Dave's Killer Bread 21 Whole Grains", amount: 1.5 },
          // 2 @ 5.99, B1G1 50%: 11.98 -> 8.99
          { label: "La Croix Grapefruit 12pk ×2", amount: 2.99 },
        ],
      },

      // 1 point per $1 of pre-tax subtotal -> 96 points on $96.30. The
      // arithmetic is checkable out loud in the room ("ninety-six dollars,
      // ninety-six points"), which is worth more than a bigger, fuzzier
      // number. 100 pts = $2 is 2% back — generous but squarely inside what
      // real grocery programmes run.
      loyalty: {
        programName: "Hartwell's Rewards",
        pointsEarned: 96,
        pointsBalance: 1240,
        balanceValue: 24, // floor(1240 / 100) * $2
        pointsPerReward: 100,
        rewardValue: 2,
        nextRewardAt: 1300,
      },

      insight: {
        // Instant, personal, zero jargon — it lands before anyone finishes
        // reading it, which is what a loud room requires.
        headline: "You just paid your lowest price yet on {skuShort}.",
        // Pre-empts the #1 objection ("that's a different pack") INSIDE the
        // copy, so the mechanic never has to be defended out loud.
        body:
          "You've bought {sku} {observationsWords} times in the past year. You usually pay about " +
          "{typical}. Today, here, it was {paidHere} — the lowest you've paid for it. PapeX only " +
          "ever compares the identical pack, so this is a real price difference, not a smaller roll.",
        evidence: {
          skuLabel: "Bounty Select-A-Size 12=24",
          skuShortLabel: "Bounty",
          observations: 6,
          windowMonths: 12,
          typicalPrice: 24.49,
          previousBest: 23.49,
          pricePaidHere: 20.99,
        },
      },

      // Consumer-generous: no basket minimum (the term a shopper notices
      // first), a long window, no exclusion list. It still carries a limit,
      // so it does not read as fake.
      //
      // 60 days from the printed 2026-09-02 runs to 2026-11-01, so the
      // urgency chip is still up through SF (Oct 5-11) and LA (Oct 12-18)
      // Tech Week — 27 days left at SF's open, 14 at LA's close.
      offer: {
        discount: 4,
        appliesTo: "Bounty Select-A-Size 12=24",
        validForDays: 60,
        limit: "Limit one per household",
        ctaLabel: "Save this coupon to PapeX",
      },
    },
  ],

  // ---------------------------------------------------------------------------
  // DEMO 2 — THE MERCHANT PITCH.  Ellsworth Market #47, Pasadena, CA.
  // Receipt printed TUE 09/08/26 17:58. Subtotal $68.18, tax $3.24, total
  // $71.42 — a mid-week fill-in shop, not a weekly stock-up, which is what
  // makes the $75 floor read as reachable rather than punitive.
  //
  // The savings number here is SMALL ON PURPOSE. $4.00 against Demo 1's
  // $11.49 is the difference between the two pitches: the consumer demo's
  // headline is "look how much we saved you", the merchant demo's is "look
  // what you just told your customer for free". Inflating it to match would
  // turn the merchant pitch into a discount pitch, which is the one thing a
  // grocer does not want to hear.
  // ---------------------------------------------------------------------------
  [
    "b0de9a0000000001",
    {
      merchantName: "Ellsworth Market",
      receiptDate: "2026-09-08",
      // Ellsworth Market is invented, and so are every price and promotion
      // below — see DemoReceiptEnrichment.fabricated. Unlike Sunset Leaf,
      // this is not a real provisioned merchant's till.
      fabricated: true,

      savings: {
        total: 4.0,
        components: [
          // 18.99 -> 15.99
          { label: "Tide Original HE Liquid 92 oz", amount: 3.0 },
          // 5.49 -> 4.49
          { label: "Romaine Hearts 3ct", amount: 1.0 },
        ],
      },

      // 1 point per $1, 200 pts = $2 — 1% back, half of Hartwell's. This is
      // the merchant-favourable calibration and it is still squarely inside
      // what real grocers run.
      loyalty: {
        programName: "Ellsworth Rewards",
        pointsEarned: 68,
        pointsBalance: 1180,
        balanceValue: 10, // floor(1180 / 200) * $2
        pointsPerReward: 200,
        rewardValue: 2,
        nextRewardAt: 1200,
      },

      insight: {
        // Credits the merchant by name and states the number — the merchant
        // hears their own name attached to the win, which is the entire
        // point of this demo.
        headline: "{merchant} came in {savedVsTypical} under your usual {skuShort} price.",
        // The triple "same" is the anti-variant clause. Kills the "that's a
        // different bottle" objection dead.
        body:
          "{sku} — you've bought this exact bottle {observationsWords} times in the last " +
          "{windowMonths} months. Your typical price is {typical}. {merchant}'s was {paidHere}. " +
          "Same bottle, same size, same formula. Just a lower shelf price.",
        evidence: {
          skuLabel: "Tide Original HE Liquid 92 oz / 64 loads",
          skuShortLabel: "Tide",
          observations: 5,
          windowMonths: 12,
          typicalPrice: 18.99,
          previousBest: 17.49,
          pricePaidHere: 15.99,
        },
      },

      // The visible number is friendly; the fine print is where the merchant
      // wins. $75 sits ~5% above this shopper's own $71.42 total — a floor
      // set against her demonstrated basket, not a store average.
      //
      // `validForDays: 42` IS A TECH WEEK MEASURE AND IS MEANT TO BE REVERTED.
      // The designed term is 14 days, chosen because it catches the next two
      // trips of a 5-7 day grocery cycle — a return-visit mechanic, which is
      // the entire merchant pitch. Six weeks is a discount, not a mechanic.
      //
      // The reason it cannot stay at 14 right now is structural, not
      // editorial. The countdown is anchored to `receiptDate` — the date
      // PRINTED on a fixed blob — and 2026-09-08 + 14 closed on 2026-09-22,
      // before SF opens. No 14-day window anchored to any date already
      // printed before Oct 5 can reach LA's close on Oct 18; for a past-dated
      // anchor the minimum is 18 days to reach SF and 31 to reach LA. The
      // registry's own pre-correction 2026-09-29 would not have reached it
      // either — that window closed 2026-10-13, the second day of LA.
      //
      // 42 days runs to 2026-10-20: 15 left at SF's open, 2 at LA's close,
      // on paper that is honestly past-dated and needs no write to a live
      // demo sid. Noah took that trade knowingly on 2026-09-17.
      //
      // THE REAL FIX, planned for 1.6.9: derive the anchor from the fetched
      // receipt's own dateline on both surfaces and leave `validForDays` as
      // the only term that lives here. Then a re-mint moves the countdown
      // with the paper, no app release is needed to keep them in step, and
      // 14 days comes back. Until that ships, the anchor is compiled into the
      // App Clip binary via DemoEnrichmentRegistry.generated.swift, which is
      // why the cheap-looking fix (re-mint closer to the event) is not cheap.
      offer: {
        discount: 10,
        minimumBasket: 75,
        validForDays: 42,
        limit: "Limit one per customer",
        exclusions: "Excludes alcohol, tobacco, pharmacy, gift cards, lottery, CRV and bag fees.",
        ctaLabel: "Save this offer",
      },

      // Option A from the content draft: plain, honest, names both the
      // recipient and the purpose, and is therefore the strongest consent
      // record of the three. Unchecked and inert — see the component.
      emailOptIn: {
        label: "Share my email with Ellsworth Market so they can send me offers like this one.",
        subLabel: "You can turn this off any time in PapeX.",
      },
    },
  ],

  // ---- Further SF / LA Tech Week demo sids ----------------------------------
  // Mint these with the demo-tag generator, confirm each returns
  // `{"claimed":[]}` from the adapter's claims-status endpoint, add them here
  // with their enrichment, DEPLOY, and only then write the tags.
  // --------------------------------------------------------------------------
]);

/**
 * Every demo sid. Derived from `DEMO_RECEIPTS` so the two can never disagree
 * — there is exactly one place a sid is declared.
 */
export const DEMO_SIDS: ReadonlySet<string> = new Set<string>(DEMO_RECEIPTS.keys());

/**
 * True when `sid` is a well-formed RDH session id AND a known demo receipt.
 *
 * `isValidSid` is composed in rather than assumed: every caller of this
 * function is deciding whether to suppress a claim affordance, and a
 * malformed sid must reach the same "not a demo receipt" answer as an
 * unknown one so the caller's production path stays the default. The map is
 * all-lowercase-hex by construction (`isValidSid`'s `^[a-f0-9]{16}$`), so no
 * case folding is needed or wanted — an uppercase sid is not a valid sid.
 */
export function isDemoSid(sid: string | undefined | null): sid is string {
  return isValidSid(sid) && DEMO_RECEIPTS.has(sid);
}

/**
 * The enrichment payload for a demo sid, or `undefined` for anything else.
 *
 * Note the asymmetry with `isDemoSid`: a demo sid with no enrichment returns
 * an EMPTY OBJECT, not `undefined`. "This is a demo receipt with nothing to
 * add" and "this is not a demo receipt" are different answers and callers
 * make different decisions from them.
 */
export function getDemoEnrichment(
  sid: string | undefined | null,
): DemoReceiptEnrichment | undefined {
  return isDemoSid(sid) ? DEMO_RECEIPTS.get(sid) : undefined;
}

/** True when an enrichment payload has nothing at all to render. */
export function isEnrichmentEmpty(e: DemoReceiptEnrichment | undefined): boolean {
  return e == null || (e.savings == null && e.loyalty == null && e.insight == null && e.offer == null && e.emailOptIn == null);
}

// =============================================================================
// FORMATTING — the edge where numbers become words
// =============================================================================
//
// Pure, exported and unit-tested, for the same reason `resolveDemoRoute` is:
// every one of these is a place a figure could be mis-stated, and a figure
// mis-stated here is a factual claim about a person that disagrees with its
// own evidence. None of them may reach for `new Date()` — the clock is always
// an argument (see `offerDaysRemaining`).

/** Dollars, always with cents: `$11.49`, `$4.00`. */
export function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Dollars for a headline figure, dropping `.00`: `$10`, `$4`, `$3.50`.
 * Used for the deal figure set large on the voucher, where "$10.00" reads
 * like a line item and "$10" reads like an offer.
 */
export function formatMoneyCompact(amount: number): string {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

/**
 * `a - b` in dollars, rounded to the cent.
 *
 * Not cosmetic. `24.49 - 20.99` is `3.5000000000000018` in IEEE-754, and
 * `formatMoney` of that is `$3.50` only by luck of the rounding mode; a
 * difference that lands on a `…4999` would print a cent low. Every derived
 * money figure in this module goes through here.
 */
export function moneyDelta(a: number, b: number): number {
  return Math.round((a - b) * 100) / 100;
}

/** Thousands-separated points: `1,240`. */
export function formatPoints(points: number): string {
  return points.toLocaleString("en-US");
}

const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen", "twenty",
];

/**
 * Small counts as words ("six"), larger ones as digits.
 *
 * Prose reads better with "six times in the past year" than "6 times", and
 * the count still lives in the evidence as a number — this is the formatter,
 * not a second copy of the fact.
 */
export function formatCountWord(n: number): string {
  return Number.isInteger(n) && n >= 0 && n < NUMBER_WORDS.length ? NUMBER_WORDS[n] : String(n);
}

// ---- Demo-data disclosure ----------------------------------------------------

/**
 * The one sentence a `fabricated` receipt discloses on the demo routes, or
 * `undefined` for anything that isn't marked one — an un-fabricated demo
 * (Sunset Leaf), an enrichment with nothing set (`{}`), or `undefined`
 * itself (a non-demo sid; `getDemoEnrichment` already returns `undefined`
 * for that case, so this composes with it directly and a caller never has to
 * check `isDemoSid` separately before calling this).
 *
 * Names the store when the payload has one, because naming it is what makes
 * the line read as a considered footnote rather than a hedge — "Hartwell's
 * Market is a store created for this demo" is a specific, checkable
 * statement; a sentence with no subject reads more defensively for the same
 * number of words. The fallback exists only so a future `fabricated: true`
 * entry that forgets a `merchantName` still renders a complete sentence
 * instead of a blank.
 */
export function formatDemoDisclosure(enrichment: DemoReceiptEnrichment | undefined): string | undefined {
  if (!enrichment?.fabricated) return undefined;
  const subject = enrichment.merchantName
    ? `${enrichment.merchantName} is a store`
    : "This receipt is from a store";
  return `${subject} created for this demo; its prices and promotions are invented.`;
}

// ---- Loyalty ----------------------------------------------------------------

/**
 * What a balance is actually worth at the register: whole rungs only.
 *
 * Grocery programmes are rung-based, not linear. 1,240 points at 100-per-$2
 * buys twelve $2 rewards and leaves 40 points on the card — it is worth $24,
 * not $24.80. Overstating it by rounding up is the kind of small lie that
 * gets caught by the one person in the room doing the arithmetic.
 */
export function loyaltyBalanceValue(loyalty: DemoLoyalty): number {
  if (loyalty.pointsPerReward <= 0) return 0;
  return Math.floor(loyalty.pointsBalance / loyalty.pointsPerReward) * loyalty.rewardValue;
}

/** The next rung strictly above the current balance, in points. */
export function loyaltyNextRung(loyalty: DemoLoyalty): number {
  if (loyalty.pointsPerReward <= 0) return loyalty.pointsBalance;
  return (Math.floor(loyalty.pointsBalance / loyalty.pointsPerReward) + 1) * loyalty.pointsPerReward;
}

/** How many points until the next reward. */
export function loyaltyPointsToNext(loyalty: DemoLoyalty): number {
  return Math.max(0, loyalty.nextRewardAt - loyalty.pointsBalance);
}

/**
 * Progress through the CURRENT rung, 0..1 — not progress toward the total
 * balance.
 *
 * 1,240 of 1,300 as a fraction is 95%, and a bar sitting at 95% says "you are
 * nearly there" about a 60-point gap that costs $60 of groceries. The honest
 * bar is the one that measures the rung the shopper is actually inside: 40
 * points into a 100-point rung is 40%. Same figures, no flattery.
 */
export function loyaltyRungProgress(loyalty: DemoLoyalty): number {
  if (loyalty.pointsPerReward <= 0) return 0;
  const intoRung = loyalty.pointsBalance % loyalty.pointsPerReward;
  return Math.min(1, Math.max(0, intoRung / loyalty.pointsPerReward));
}

// ---- Savings ----------------------------------------------------------------

/**
 * Whether the itemised components add up to the stated total, to the cent.
 *
 * Compared in integer cents, not with an epsilon: `7 + 1.5 + 2.99` is
 * `11.489999999999998`, and `=== 11.49` is false. Exported rather than left
 * in the test file because it is the invariant, not the assertion.
 */
export function savingsComponentsMatchTotal(savings: DemoSavings): boolean {
  const cents = savings.components.reduce((sum, c) => sum + Math.round(c.amount * 100), 0);
  return cents === Math.round(savings.total * 100);
}

// ---- Insight copy -----------------------------------------------------------

/**
 * The template vocabulary. Closed and small on purpose: a template language
 * grows into a programming language if you let it, and this one only has to
 * put six figures into two sentences.
 */
export const INSIGHT_TOKENS = [
  "sku",
  "skuShort",
  "observations",
  "observationsWords",
  "windowMonths",
  "typical",
  "previousBest",
  "paidHere",
  "savedVsTypical",
  "savedVsBest",
  "merchant",
] as const;

export type InsightToken = (typeof INSIGHT_TOKENS)[number];

/** Every substitution available to an insight template, already formatted. */
export function insightTokenValues(
  evidence: DemoInsightEvidence,
  merchantName?: string,
): Record<InsightToken, string> {
  return {
    sku: evidence.skuLabel,
    skuShort: evidence.skuShortLabel,
    observations: String(evidence.observations),
    observationsWords: formatCountWord(evidence.observations),
    windowMonths: String(evidence.windowMonths),
    typical: formatMoney(evidence.typicalPrice),
    previousBest: formatMoney(evidence.previousBest),
    paidHere: formatMoney(evidence.pricePaidHere),
    savedVsTypical: formatMoney(moneyDelta(evidence.typicalPrice, evidence.pricePaidHere)),
    savedVsBest: formatMoney(moneyDelta(evidence.previousBest, evidence.pricePaidHere)),
    // "this store" rather than nothing: the sentence has to survive a payload
    // that never got a merchant name, and a dangling " came in $3.00 under"
    // is worse than a generic subject.
    merchant: merchantName ?? "this store",
  };
}

/**
 * Fills `{token}` placeholders in an insight template from its evidence.
 *
 * An UNKNOWN token is left verbatim rather than throwing. This renders inside
 * a server component, so a throw is a 500, and a 500 at a booth is far worse
 * than a visible `{typo}` that someone can read past. The guard is the test
 * suite instead: `renderInsightCopy` of every seeded template must leave no
 * braces behind, so a typo cannot reach a tag.
 */
export function renderInsightCopy(
  template: string,
  evidence: DemoInsightEvidence,
  merchantName?: string,
): string {
  const values = insightTokenValues(evidence, merchantName) as Record<string, string>;
  return template.replace(/\{([a-zA-Z]+)\}/g, (whole, token: string) =>
    Object.prototype.hasOwnProperty.call(values, token) ? values[token] : whole,
  );
}

/**
 * The evidence, as labelled rows.
 *
 * A labelled grid rather than the one long "· 6 purchases · last 12 months ·"
 * line the content draft sketches: identical figures, but a 430px phone
 * column wraps that line into an unreadable ribbon, and the whole purpose of
 * showing the evidence is that somebody can check it at a glance.
 */
export function insightEvidenceRows(evidence: DemoInsightEvidence): { label: string; value: string }[] {
  return [
    {
      label: "Purchases",
      value: `${evidence.observations} in the last ${evidence.windowMonths} months`,
    },
    { label: "You usually pay", value: formatMoney(evidence.typicalPrice) },
    { label: "Your previous best", value: formatMoney(evidence.previousBest) },
    { label: "Today, here", value: formatMoney(evidence.pricePaidHere) },
  ];
}

// ---- Offer window: the relative-expiry rules --------------------------------
//
// See the block comment on `DemoOffer` for WHY none of this produces a
// calendar date. In short: the sticker outlives the coupon, and a demo that
// advertises a dead coupon reads as broken software rather than as an old
// receipt.

const DAY_MS = 86_400_000;

/**
 * A calendar day as an integer, in UTC.
 *
 * UTC on both sides, deliberately. The render happens on a server whose only
 * clock is UTC; using local time would make the countdown flip a day earlier
 * or later depending on where the process happens to run, and DST would make
 * `(a - b) / 86400000` non-integral twice a year. A demo does not need
 * sub-day precision, and it does need to be the same everywhere.
 */
function utcDayNumber(d: Date): number {
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / DAY_MS);
}

/** `YYYY-MM-DD` -> day number, or null if it isn't one. */
function parseIsoDay(iso: string | undefined): number | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [, y, mo, d] = m;
  return civilDay(Number(y), Number(mo), Number(d));
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  return month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];
}

/**
 * A validated `year`/`month`/`day` triple -> UTC day number, or null.
 *
 * Calendar-validated BEFORE handing anything to `Date.UTC`, which rolls an
 * out-of-range day into the next month instead of refusing it (`Date.UTC`
 * would turn Feb 30 into Mar 2). A date that does not exist must be refused,
 * not silently reinterpreted, the same rule `parseIsoDay`'s ISO regex and
 * `DemoCalendar.utcDayNumber(isoDay:)` on the Swift side both enforce.
 */
function civilDay(year: number, month: number, day: number): number | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  const ms = Date.UTC(year, month - 1, day);
  return Number.isFinite(ms) ? Math.floor(ms / DAY_MS) : null;
}

// ---- Deriving the anchor from the receipt's OWN printed dateline ------------
//
// 1.6.9's fix for the compiled-in-anchor problem described on `DemoOffer`
// above: rather than trusting only the registry's `receiptDate` (which
// silently desyncs from a re-minted blob unless a matching app release
// ships), derive the voucher's anchor day from the dateline actually printed
// on THIS fetched receipt, and fall back to `receiptDate` only when that
// fails. The paper is canonical; the registry field becomes a fallback for
// a blob that predates this fix, or a parse the dateline defeats.
//
// ---------------------------------------------------------------------------
// THE SHARED PARSING RULE — kept in lockstep with DemoEnrichment.swift's
// `DemoCalendar.utcDayNumber(dateline:)`. Read this block before changing
// either side; the two must accept and reject the exact same inputs.
// ---------------------------------------------------------------------------
// Input is the `dateline` field `lib/receiptSummary.ts`'s `extractDateline`
// (and its Swift twin, `ReceiptSummary.swift`'s `extractDateline`) already
// produced — either "<date>" or "<date> • <time>". Steps:
//
//   1. Take the substring before " • " (or the whole string if there is no
//      bullet); trim it. Empty -> fail.
//   2. If it matches `^\d{4}-\d{2}-\d{2}$` (ISO), parse year/month/day
//      directly.
//   3. Else if it matches `^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$` (US order
//      MM/DD/Y(Y)(YY), matching how every printer ESC/POS text seen so far
//      dates its receipts, including both Tech Week demo blobs), parse
//      month/day/year. A 2-digit year YY means 20YY — every demo blob this
//      product will ever print is in the 2000s.
//   4. Otherwise, fail — INCLUDING a month-name dateline ("Jun 8, 2026"),
//      a format `Patterns.date` / `DATE_RE` can also extract but that no
//      seeded demo blob currently uses. Failing safely here just means the
//      registry's `receiptDate` fallback fires; it is not a bug to fix
//      later so much as a deliberately unimplemented case, done to keep
//      both parsers small and exactly comparable rather than to imply the
//      format cannot occur.
//   5. Every month/day/year candidate is calendar-validated (`civilDay`)
//      before being accepted — 13/40/26 and 02/30/26 both fail rather than
//      rolling over.
//
// On success: a UTC calendar day number, comparable with `parseIsoDay`'s
// result. On failure: null, and the caller falls back to `receiptDate`.

/** The DATE portion of an `extractDateline`-shaped string, before any " • time" suffix. */
function datePartOf(dateline: string): string {
  const bullet = dateline.indexOf(" • ");
  return (bullet === -1 ? dateline : dateline.slice(0, bullet)).trim();
}

/** Step 3 above: `M/D/Y`, `M-D-Y`, 1-2 digit month/day, 2 or 4 digit year. */
const SLASH_DATE_RE = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/;

/**
 * The receipt's own printed dateline -> a UTC calendar day number, or null.
 * See the shared parsing rule above. Mirrors
 * `DemoEnrichment.swift`'s `DemoCalendar.utcDayNumber(dateline:)`.
 */
export function anchorDayFromDateline(dateline: string | null | undefined): number | null {
  if (!dateline) return null;
  const datePart = datePartOf(dateline);
  if (!datePart) return null;

  const isoDay = parseIsoDay(datePart);
  if (isoDay != null) return isoDay;

  const slash = SLASH_DATE_RE.exec(datePart);
  if (slash) {
    const [, moStr, dStr, yStr] = slash;
    const year = yStr.length === 2 ? 2000 + Number(yStr) : Number(yStr);
    return civilDay(year, Number(moStr), Number(dStr));
  }

  return null;
}

/**
 * How the voucher states its own validity. ALWAYS a duration, NEVER a date,
 * and therefore true on every date there will ever be.
 *
 * This is the line that must survive a tap in March. It is a pure function of
 * `validForDays` — no clock, no anchor, nothing that can go stale.
 */
export function formatOfferValidity(offer: DemoOffer): string {
  const d = offer.validForDays;
  return d === 1 ? "Valid for 1 day from purchase" : `Valid for ${d} days from purchase`;
}

/**
 * Whole days left in the window, measured from the receipt's own date.
 *
 * `today` is an argument and never `new Date()` — that is what makes this
 * testable at simulated dates, and it is the only way to be sure the
 * permanent-sticker case is handled rather than hoped for.
 *
 * `receiptDatelineText` is `ReceiptSummary.dateline` off the ACTUAL fetched
 * blob (e.g. "09/02/26 • 18:42") — optional so every existing call site and
 * test keeps working unchanged. When it parses (see `anchorDayFromDateline`),
 * IT is the anchor: the paper is canonical, and a re-minted blob's countdown
 * then moves with the new printed date without a registry edit or an app
 * release. `enrichment.receiptDate` is the fallback, used only when no
 * dateline text was supplied or the printed dateline didn't parse — the exact
 * behaviour this function had before 1.6.9, preserved for a blob whose
 * dateline this parser doesn't recognise.
 *
 * Returns `null` — meaning "show nothing" — when:
 *   - there is no offer or no anchor date to measure from (neither the
 *     dateline nor the registry produced one), or
 *   - the window has already closed.
 *
 * The second case is the whole design. Once the window is up, the urgency
 * chip simply vanishes; it never becomes "Expired", because the voucher's own
 * validity line ("Valid for 42 days from purchase") is still true and an
 * "Expired" stamp on a permanent demo tag is the exact failure this function
 * exists to prevent.
 *
 * `0` means today is the last day and is a real answer, not an absence —
 * hence `null` rather than `-1` for the closed case.
 */
export function offerDaysRemaining(
  enrichment: DemoReceiptEnrichment | undefined,
  today: Date,
  receiptDatelineText?: string | null,
): number | null {
  const offer = enrichment?.offer;
  if (!offer) return null;
  const anchor = anchorDayFromDateline(receiptDatelineText) ?? parseIsoDay(enrichment?.receiptDate);
  if (anchor == null) return null;

  const todayDay = utcDayNumber(today);
  // A clock set before the receipt was printed (a wrong device date, a
  // replayed fixture) shows the full window rather than an impossible one.
  if (todayDay <= anchor) return offer.validForDays;

  const remaining = anchor + offer.validForDays - todayDay;
  return remaining >= 0 ? remaining : null;
}

/**
 * The urgency chip's text. Only ever called with a non-null result from
 * `offerDaysRemaining`, so there is no "expired" branch to get wrong.
 */
export function formatDaysRemaining(days: number): string {
  if (days <= 0) return "Last day";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

/**
 * The voucher's qualifier line — the small print under the big figure.
 *
 * "No minimum" is rendered, not omitted, when there is no floor. It is the
 * most consumer-friendly term an offer can carry and the first thing a
 * shopper looks for; a blank space says nothing, and a shopper reads nothing
 * as "there's a catch I haven't found yet".
 */
export function formatOfferQualifier(offer: DemoOffer): string {
  return offer.minimumBasket != null ? `On ${formatMoneyCompact(offer.minimumBasket)}+` : "No minimum";
}

/**
 * The offer as one sentence: "$10 off your next purchase of $75 or more at
 * Ellsworth Market." / "$4.00 off Bounty Select-A-Size 12=24 at Hartwell's
 * Market."
 */
export function formatOfferSentence(offer: DemoOffer, merchantName?: string): string {
  const at = merchantName ? ` at ${merchantName}` : "";
  if (offer.appliesTo) {
    return `${formatMoneyCompact(offer.discount)} off ${offer.appliesTo}${at}.`;
  }
  if (offer.minimumBasket != null) {
    return `${formatMoneyCompact(offer.discount)} off your next purchase of ${formatMoneyCompact(
      offer.minimumBasket,
    )} or more${at}.`;
  }
  return `${formatMoneyCompact(offer.discount)} off your next purchase${at}.`;
}

// =============================================================================
// ROUTING
// =============================================================================

/** What a demo route should do with the sid it was handed. */
export type DemoRouteDecision =
  | { action: "render"; sid: string }
  | { action: "redirect"; url: string };

/**
 * The demo routes' front door (app/r/demo, app/demo/r).
 *
 * FAIL TOWARD PRODUCTION, NEVER THE REVERSE. Anything that is not a known
 * demo sid — a real customer's sid, a malformed one, a missing one — is sent
 * to `/r`, the route that knows how to be honest about all three (real
 * receipt / "not available" / sample only when nobody tapped anything). The
 * one thing that must never happen is the opposite: a production receipt
 * picking up demo semantics because it arrived through a demo-shaped URL.
 *
 * Split out of the page component for the same reason lib/merchantHost.ts is
 * split out of middleware.ts — so the decision can be unit-tested without a
 * Next.js runtime. The page is a thin adapter over this.
 */
export function resolveDemoRoute(rawSid: string | undefined | null): DemoRouteDecision {
  // Read out before the guard: `isDemoSid` is a type predicate, so after it
  // TypeScript has narrowed `rawSid` away from `string` entirely and the
  // sid-bearing redirect — the case this function exists for — would type as
  // unreachable.
  //
  // Trimmed only for the "did they send anything at all" test. The demo check
  // itself runs on the raw value, because `isValidSid` does not trim either:
  // a sid with whitespace in it is not a valid sid anywhere in this codebase,
  // and it should reach `/r`'s "Receipt not available" the same way any other
  // malformed sid does.
  const trimmed = typeof rawSid === "string" ? rawSid.trim() : "";

  if (isDemoSid(rawSid)) {
    return { action: "render", sid: rawSid };
  }

  // A bare or whitespace-only sid carries nothing worth forwarding; `/r`'s
  // own no-sid handling takes it from there.
  return {
    action: "redirect",
    url: trimmed.length > 0 ? `/r?sid=${encodeURIComponent(trimmed)}` : "/r",
  };
}
