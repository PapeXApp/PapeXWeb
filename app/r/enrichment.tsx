// app/r/enrichment.tsx
//
// The PapeX value layer: what gets rendered BELOW the receipt on the demo
// routes. Savings, loyalty, the price insight, the merchant's offer, and the
// email opt-in — each drawn only when lib/demoReceipts.ts has one for the sid.
//
// ---------------------------------------------------------------------------
// TWO VOICES, TWO CONTAINERS
// ---------------------------------------------------------------------------
// The single most important thing in this file is that the INSIGHT and the
// OFFER do not look alike.
//
//   - The insight is PAPEX's speech. It is an observation about the shopper,
//     derived from the shopper's own receipts. It renders as dark glass, in
//     the page's own design system, under the PapeX mark.
//   - The offer is the MERCHANT's speech. It is an advertisement with terms.
//     It renders as an opaque paper voucher in the merchant's warm ramp, with
//     notched edges and a perforation — a different substrate entirely.
//
// That separation is not styling preference. Comparative-advertising
// liability attaches to the offer and not to the observation, the merchant
// contract has to allocate it explicitly, and this is the UI expression of
// that allocation. It also happens to be better UX: nobody has to be told
// which voice is talking.
//
// ---------------------------------------------------------------------------
// EVERYTHING HERE IS A SERVER COMPONENT
// ---------------------------------------------------------------------------
// Same rule as ui.tsx and chrome.tsx: nothing in this file may import a
// client island. Next includes every client entry point reachable from a
// page's module graph whether it renders or not, and the demo routes'
// entire premise is that SaveToPapex — and the Firebase auth SDK behind it —
// is not in their graph at all. A demo tag must never offer an action that
// can fail; keeping the claim island unreachable is a stronger guarantee than
// remembering not to render it.
//
// The one interactive control on this page — the email opt-in checkbox — is
// therefore a bare uncontrolled <input>, which the browser toggles on its own
// with no JavaScript from us. See EmailOptInCard for why that is also the
// only acceptable way to build it.
//
// ---------------------------------------------------------------------------
// NO FIGURE IS TYPED TWICE
// ---------------------------------------------------------------------------
// Every number on screen is formatted from the payload by a function in
// lib/demoReceipts.ts. Nothing in this file computes a price, a delta, a
// percentage or a date, and no sentence has a figure baked into it — the
// insight copy is a template filled from its own evidence. The copy will
// change repeatedly before an event; the figures must not drift when it does,
// because a price claim that disagrees with its own supporting data is a
// factual claim about a person that we cannot defend.

import type { CSSProperties, ReactNode } from "react";
import { Award, Mail, Ticket, TrendingDown } from "lucide-react";
import {
  type DemoEmailOptIn,
  type DemoInsight,
  type DemoLoyalty,
  type DemoOffer,
  type DemoReceiptEnrichment,
  type DemoSavings,
  LOYALTY_DISCLOSURE,
  formatDaysRemaining,
  formatMoney,
  formatMoneyCompact,
  formatOfferQualifier,
  formatOfferSentence,
  formatOfferValidity,
  formatPoints,
  insightEvidenceRows,
  isEnrichmentEmpty,
  loyaltyPointsToNext,
  loyaltyRungProgress,
  renderInsightCopy,
} from "@/lib/demoReceipts";
import { GlassCard, S, T } from "./chrome";
import voucher from "./voucher.module.css";

// The ink used on the merchant's orange field. ~5.2:1 against the ramp's
// mid-stop — over the 3.0 minimum PapeXV2's brandContrast.ts sets for text on
// a brand field. White ink measures ~2.7 on this ramp and is not available.
const VOUCHER_INK = "#00121D";
const VOUCHER_INK_SOFT = "rgba(0, 18, 29, 0.72)";

/** Section heading, matching ItemsCard / TotalsCard: sits on the page
 *  background, so it uses the theme-aware shell token, never the card-fixed
 *  one (design kit §8). */
function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="font-barlow mb-2 px-1 text-xl font-medium" style={{ color: S.text }}>
      {children}
    </p>
  );
}

// ---- Savings ----------------------------------------------------------------
//
// The composition rows are the point. An unbroken "$11.49" reads like
// marketing; three itemised components read like a ledger, and the ledger is
// what makes the number survive the first person who decides to check it.

function SavingsCard({ savings }: { savings: DemoSavings }) {
  return (
    <div>
      <SectionTitle>Savings</SectionTitle>
      <GlassCard emphasis="standard" className="p-6">
        <div className="flex items-baseline gap-2">
          <TrendingDown className="h-5 w-5 shrink-0 self-center" style={{ color: T.success }} strokeWidth={2} />
          <span className="font-barlow text-2xl font-medium" style={{ color: T.success }}>
            {formatMoney(savings.total)}
          </span>
          <span className="text-base" style={{ color: T.textSecondary }}>
            saved today
          </span>
        </div>
        {savings.components.length > 0 && (
          <div className="mt-4 flex flex-col">
            {savings.components.map((c, i) => (
              <div
                key={c.label}
                className="flex items-center justify-between gap-3 py-2"
                style={
                  i === savings.components.length - 1
                    ? undefined
                    : { borderBottom: `1px solid ${T.divider}` }
                }
              >
                <span className="min-w-0 flex-1 truncate text-sm" style={{ color: T.textSecondary }}>
                  {c.label}
                </span>
                <span className="font-barlow shrink-0 text-sm font-medium" style={{ color: T.success }}>
                  {formatMoney(c.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ---- Loyalty ----------------------------------------------------------------
//
// The disclosure line at the bottom is NOT optional and must not be cut. It
// answers a real objection ("do you take my points?") and it is what keeps
// this block clear of anything that reads as PapeX holding value on the
// shopper's behalf at somebody else's register.

function LoyaltyCard({ loyalty }: { loyalty: DemoLoyalty }) {
  const toNext = loyaltyPointsToNext(loyalty);
  const pct = Math.round(loyaltyRungProgress(loyalty) * 100);
  return (
    <div>
      <SectionTitle>Rewards</SectionTitle>
      <GlassCard emphasis="neutral" className="p-6">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 shrink-0" style={{ color: T.orange }} strokeWidth={2} />
          <span
            className="text-[11px] font-semibold uppercase tracking-[1.2px]"
            style={{ color: T.orange }}
          >
            {loyalty.programName}
          </span>
          <span className="ml-auto font-barlow text-base font-medium" style={{ color: T.success }}>
            +{formatPoints(loyalty.pointsEarned)} pts
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-barlow text-2xl font-medium" style={{ color: T.text }}>
            {formatPoints(loyalty.pointsBalance)}
          </span>
          <span className="text-base" style={{ color: T.textSecondary }}>
            points
          </span>
          <span className="ml-auto font-barlow text-base font-medium" style={{ color: T.blue }}>
            worth {formatMoneyCompact(loyalty.balanceValue)}
          </span>
        </div>

        {/* The bar measures progress through the rung the shopper is actually
            inside, not balance-over-threshold — see loyaltyRungProgress. The
            width comes from the same figures printed beside it, so the two
            cannot disagree. */}
        <div className={`mt-3 ${voucher.loyaltyTrack}`} aria-hidden>
          <div className={voucher.loyaltyFill} style={{ "--pct": `${pct}%` } as CSSProperties} />
        </div>

        <p className="mt-2 text-sm" style={{ color: T.textSecondary }}>
          {formatPoints(toNext)} points from your next {formatMoneyCompact(loyalty.rewardValue)} reward
          {" "}({formatPoints(loyalty.nextRewardAt)} pts).
        </p>

        <p className="mt-3 text-xs" style={{ color: T.textMuted }}>
          {LOYALTY_DISCLOSURE}
        </p>
      </GlassCard>
    </div>
  );
}

// ---- The insight: PapeX's speech ---------------------------------------------
//
// Carries the PapeX mark, in the page's own glass system, deliberately
// unlike the voucher below it.
//
// Headline and body are rendered from templates against the evidence — the
// figures in the prose and the figures in the table below are the same
// numbers, formatted once. The claim is always the shopper against their own
// history: never another store's price, never a price the shopper did not
// personally pay, and never the words "cheaper elsewhere".

function InsightCard({ insight, merchantName }: { insight: DemoInsight; merchantName?: string }) {
  const headline = renderInsightCopy(insight.headline, insight.evidence, merchantName);
  const body = renderInsightCopy(insight.body, insight.evidence, merchantName);
  const rows = insightEvidenceRows(insight.evidence);

  return (
    <div>
      <SectionTitle>A message from PapeX</SectionTitle>
      <GlassCard emphasis="standard" className="p-6">
        <div className="flex items-center gap-2">
          {/* The PapeX wordmark, same artwork as the page header. This block
              is the one place on the page where PapeX is the speaker rather
              than the carrier, so it is worth the mark. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/main_logo.png" alt="PapeX" className="h-4 w-auto shrink-0" style={{ objectFit: "contain" }} />
          <span
            className="text-[11px] font-semibold uppercase tracking-[1.2px]"
            style={{ color: T.textMuted }}
          >
            From your own receipts
          </span>
        </div>

        <h2 className="font-barlow mt-3 text-xl font-medium leading-snug" style={{ color: T.text }}>
          {headline}
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: T.textSecondary }}>
          {body}
        </p>

        <div className="mt-4 flex flex-col" style={{ borderTop: `1px solid ${T.divider}` }}>
          {rows.map((row, i) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 py-2"
              style={i === rows.length - 1 ? undefined : { borderBottom: `1px solid ${T.divider}` }}
            >
              <span className="min-w-0 flex-1 text-sm" style={{ color: T.textMuted }}>
                {row.label}
              </span>
              <span className="font-barlow shrink-0 text-sm font-medium" style={{ color: T.text }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs" style={{ color: T.textMuted }}>
          Compared against the identical pack only, from receipts you captured.
        </p>
      </GlassCard>
    </div>
  );
}

// ---- The offer: the merchant's speech, as a paper voucher ---------------------
//
// `daysRemaining` is null once the window has closed, and then the chip is
// simply absent. There is no "Expired" state, on purpose: the stickers are
// permanent, the validity line below states a DURATION rather than a date and
// is therefore true forever, and a permanent tag advertising a dead coupon
// reads as broken software rather than as an old receipt. The full argument
// lives on DemoOffer in lib/demoReceipts.ts.
//
// THE CTA IS A PRINTED INSTRUCTION, NOT A BUTTON. It is set in the stub like
// the action line on a paper coupon, and it is not focusable or pressable.
// This route exists because a demo must never offer an action that can fail —
// that is the entire argument behind suppressing "Save to PapeX" here — and a
// button that does nothing when a stranger presses it is the same defect in a
// smaller box. The one working action on this page stays "Get PapeX", in the
// footer, where it can actually succeed.

function OfferVoucher({
  offer,
  merchantName,
  daysRemaining,
}: {
  offer: DemoOffer;
  merchantName?: string;
  daysRemaining: number | null;
}) {
  return (
    <div>
      <SectionTitle>{merchantName ? `An offer from ${merchantName}` : "An offer for you"}</SectionTitle>
      <div className={voucher.ticket}>
        {/* ---- The field: the deal figure, large, with its qualifier ---- */}
        <div className={`${voucher.field} px-6 pb-6 pt-5`}>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Ticket className="h-4 w-4 shrink-0" style={{ color: VOUCHER_INK_SOFT }} strokeWidth={2} />
                <span
                  className="text-[11px] font-semibold uppercase tracking-[1.2px]"
                  style={{ color: VOUCHER_INK_SOFT }}
                >
                  Next visit
                </span>
              </div>
              <div className="font-barlow mt-1 text-5xl font-semibold leading-none" style={{ color: VOUCHER_INK }}>
                {formatMoneyCompact(offer.discount)}
                <span className="ml-2 text-xl font-medium">off</span>
              </div>
              <p className="mt-1.5 text-sm font-medium" style={{ color: VOUCHER_INK_SOFT }}>
                {formatOfferQualifier(offer)}
              </p>
            </div>
            {daysRemaining != null && (
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${voucher.daysChip}`}
              >
                {formatDaysRemaining(daysRemaining)}
              </span>
            )}
          </div>
        </div>

        {/* ---- The stub: terms, then the printed action line ---- */}
        <div className={`${voucher.stub} px-6 pb-5 pt-5`}>
          <p className="text-sm font-medium leading-snug" style={{ color: VOUCHER_INK }}>
            {formatOfferSentence(offer, merchantName)}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: VOUCHER_INK_SOFT }}>
            {formatOfferValidity(offer)}. {offer.limit}.
            {offer.exclusions ? ` ${offer.exclusions}` : ""}
          </p>
          <div
            className="mt-4 rounded-xl px-4 py-3 text-center text-sm font-semibold uppercase tracking-[1px]"
            style={{ border: `1px dashed ${VOUCHER_INK}`, color: VOUCHER_INK }}
          >
            {offer.ctaLabel}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Email opt-in ------------------------------------------------------------
//
// UNCHECKED BY DEFAULT AND COMPLETELY INERT. Both halves are load-bearing.
//
// Unchecked, because a pre-checked box is a CPRA/CAN-SPAM problem and,
// sooner than that, the thing a privacy-literate person in the room will spot
// and call out — which turns your demo into their demo.
//
// Inert, because a demo phone passes through dozens of hands. Concretely, and
// verifiably from this code:
//   - no `name`, and no enclosing <form>: there is nothing for the browser to
//     submit, to any URL, ever.
//   - no `onChange`, no client component, no JavaScript of any kind on this
//     page: nothing observes the box, so nothing can report it.
//   - no email address is displayed, prefilled, requested or inferred. The
//     label names the merchant and the purpose and stops there. An App Clip
//     or a Sign-in-with-Apple session could surface a real address on a
//     borrowed phone, so nothing here goes looking for one.
//   - nothing anywhere implies an email WAS sent.
// The browser toggles it natively, which is exactly the amount of behaviour
// this control should have.
//
// Before any of this ships for real it needs a genuine consent record, a real
// sender identity for the merchant and a working unsubscribe path. None of
// those belong in a demo, and faking them would be worse than omitting them.

function EmailOptInCard({ optIn }: { optIn: DemoEmailOptIn }) {
  return (
    <GlassCard emphasis="none" className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Mail className="h-4 w-4 shrink-0" style={{ color: T.textMuted }} strokeWidth={2} />
        <span className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: T.textMuted }}>
          Stay in touch
        </span>
      </div>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer"
          /* `colorScheme: dark` so the native control paints itself for a dark
             surface. The page shell can be in light mode but the card under it
             never is (design kit §8), and without this the browser draws a
             white slab on navy glass. */
          style={{ accentColor: T.orange, colorScheme: "dark" }}
        />
        <span className="min-w-0">
          <span className="block text-sm leading-snug" style={{ color: T.text }}>
            {optIn.label}
          </span>
          <span className="mt-1 block text-xs" style={{ color: T.textMuted }}>
            {optIn.subLabel}
          </span>
        </span>
      </label>
    </GlassCard>
  );
}

// ---- The whole layer ---------------------------------------------------------

/**
 * Renders whatever enrichment this receipt has, in the order the pitch runs:
 * what this basket saved, what it earned, what PapeX noticed, what the
 * merchant is offering next, and the consent control.
 *
 * Renders NOTHING at all for a demo sid with no enrichment — the Sunset Leaf
 * bench tag, or any new sid added before its figures are. That is a
 * first-class outcome, not a degraded one: the page falls back to exactly
 * what it rendered before this layer existed.
 *
 * `now` is a parameter rather than a `new Date()` inside, so the page owns
 * the clock and every function under here stays pure and testable at
 * simulated dates. It is only ever used for the offer's urgency chip; nothing
 * else on this page depends on what day it is, which is the property that
 * lets a permanent sticker stay true.
 */
export function EnrichmentSections({
  enrichment,
  daysRemaining,
}: {
  enrichment: DemoReceiptEnrichment | undefined;
  /** From `offerDaysRemaining(enrichment, now)`. Null hides the urgency chip. */
  daysRemaining: number | null;
}) {
  if (isEnrichmentEmpty(enrichment) || !enrichment) return null;

  return (
    <div className="flex flex-col gap-4">
      {enrichment.savings && <SavingsCard savings={enrichment.savings} />}
      {enrichment.loyalty && <LoyaltyCard loyalty={enrichment.loyalty} />}
      {enrichment.insight && (
        <InsightCard insight={enrichment.insight} merchantName={enrichment.merchantName} />
      )}
      {enrichment.offer && (
        <OfferVoucher
          offer={enrichment.offer}
          merchantName={enrichment.merchantName}
          daysRemaining={daysRemaining}
        />
      )}
      {enrichment.emailOptIn && <EmailOptInCard optIn={enrichment.emailOptIn} />}
    </div>
  );
}
