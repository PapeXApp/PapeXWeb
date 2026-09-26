import { Phone } from "lucide-react"
import { WordReveal, ChildStagger, Ripple, Spotlight } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { parseEscPos } from "@/lib/escpos"
import { summarizeReceipt } from "@/lib/receiptSummary"
import { demoReceiptBytes } from "../customer/demoReceipt"
import { receiptMoment } from "../customer/appui/Clip"
import { hero } from "./content"
import { LoopVisual } from "./hero/LoopVisual"
import styles from "./business.module.css"

// 3.1 Hero — NAVY. The fork's navy top half leads here (2026-09-10), so the
// page opens on the same flat #00121D and the commit reads as that half
// growing. FlowGround (`initial="navy"`) paints the ground; this section only
// declares it, and its text uses the ground's --flow-* ink.
// Full screen again (2026-09-22, "screens, not sections"): the capped
// version measured 559px tall at 1440x900 with the device spilling past the
// hero's bottom edge into section 02. `styles.screen` makes it >= 100svh and
// centres the column in that box, so the device is fully contained and the
// CTA row sits on the screen's midline instead of leaving a dead band under
// it.
//
// Web 2.1 wave 3 (Nico, 2026-09-24): the visual column no longer shows the
// PapeX device box ("we don't want to make it seem like we're a hardware
// company… especially if investors are looking"), and the infinite float
// that came with it is gone. It shows the RETURN-VISIT LOOP instead.
//
// P3-B1 (Nico, 2026-09-25: "not clear, not intuitive… moves too fast"): the
// loop is now a slow, LOOPED story at a checkout counter — tap the PapeX
// device, the receipt (zoomed in, scrolled), the coupon for next time, then
// back at the counter to use it — one captioned beat at a time, paused off
// screen: hero/LoopVisual.tsx. P3-B7 (Nico's storyboard): tap -> App Clip
// card -> View -> the receipt with the coupon on top -> Save to PapeX -> open
// the coupon -> turned to the counter and scanned, ~25s a cycle.
export function Hero() {
  // The demo receipt is decoded HERE, on the server, through this repo's own
  // lib/escpos.ts + lib/receiptSummary.ts (same bytes and path as /customers),
  // so the parser never ships in the /business bundle.
  const summary = summarizeReceipt(parseEscPos(demoReceiptBytes()).lines)
  const clock = receiptMoment(summary.dateline).time
  return (
    <FlowSection
      ground="navy"
      className={`${styles.screen} overflow-hidden px-[clamp(20px,5vw,56px)] pb-[var(--section-pad-y)] pt-[clamp(96px,12vh,120px)]`}
    >
      {/* No JS: LoopVisual's stage and caption wait hidden for hydration
          (see its STILL FRAME note); without JS they show the still frame. */}
      <noscript>
        <style>{`[data-hero-loop]{opacity:1!important}`}</style>
      </noscript>
      <Spotlight
        strength={70}
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(80% 70% at 22% 40%, rgba(235,113,0,.15), transparent 55%)",
        }}
      />

      {/* Text column gets the larger share: at an even split the 80px
          headline broke into five one-word lines. */}
      <div className="relative mx-auto grid w-full max-w-[1150px] grid-cols-1 items-center gap-[clamp(30px,5vw,70px)] min-[900px]:grid-cols-[1.14fr_.86fr]">
        <ChildStagger className="max-w-[620px]">
          <SectionLabel index="01">{hero.eyebrow}</SectionLabel>
          <WordReveal
            as="h1"
            className="text-[length:var(--fs-h1-merchant)] font-bold leading-[1.02] tracking-[-.025em] [font-family:var(--font-display)]"
          >
            {hero.heading}
          </WordReveal>
          <p
            className="mt-[var(--gap-title)] max-w-[46ch] text-[length:var(--fs-lead)] leading-[1.5]"
            style={{ color: "var(--flow-fg-2)" }}
          >
            {hero.lead}
          </p>
          {/* Nico's approved paper line. If "Zero paper" ever returns to the
              H1, it is only allowed with this line under it. */}
          <p
            className="mt-[calc(var(--gap-title)*.5)] max-w-[46ch] text-[length:var(--fs-lead)] font-semibold leading-[1.5]"
            style={{ color: "var(--flow-fg)" }}
          >
            {hero.paperLine}
          </p>
          <div className="mt-[var(--gap-body)] flex flex-wrap items-center gap-3.5">
            {/* Jumps to the on-page demo form (section 3.7). */}
            <Ripple as="div" variant="navy" className="inline-block overflow-hidden rounded-full">
              <a
                href="#demo"
                className="block rounded-full px-[30px] py-[15px] text-base font-semibold transition-shadow duration-300 hover:shadow-[0_12px_34px_rgba(235,113,0,.5)]"
                style={{
                  background: "var(--orange)",
                  color: "var(--navy)",
                  boxShadow: "0 6px 22px rgba(235,113,0,.3)",
                }}
              >
                {hero.ctaLabel}
              </a>
            </Ripple>
            {/* Click-to-call chip (3.1b) — dark glass on the navy hero. Its
                fill, border and ink are derived from the ground's ink, so it
                stays legible if the ground crossfades while it's on screen. */}
            <a
              href={hero.phoneHref}
              className="inline-flex items-center gap-[11px] rounded-full border px-5 py-[7px] no-underline transition-[border-color,box-shadow,transform] duration-[250ms] hover:-translate-y-px hover:border-[rgba(235,113,0,.45)]"
              style={{
                background: "color-mix(in srgb, var(--flow-fg) 6%, transparent)",
                borderColor: "color-mix(in srgb, var(--flow-fg) 14%, transparent)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
                backdropFilter: "blur(14px) saturate(140%)",
                WebkitBackdropFilter: "blur(14px) saturate(140%)",
              }}
            >
              <span
                aria-hidden="true"
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full"
                style={{ background: "rgba(235,113,0,.16)" }}
              >
                <Phone size={15} strokeWidth={2.2} style={{ color: "var(--orange)" }} />
              </span>
              <span className="flex flex-col leading-[1.15]">
                <span
                  className="text-[11px] font-semibold uppercase tracking-[.14em]"
                  style={{ color: "var(--flow-fg-3)" }}
                >
                  {hero.phoneLabel}
                </span>
                <span className="text-[17px] font-bold tracking-[-.01em]" style={{ color: "var(--flow-fg)" }}>
                  {hero.phone}
                </span>
              </span>
            </a>
          </div>
          {/* Secondary anchor (Web 2.1): for the merchant who wants to see the
              customer's side before asking for a demo. Points at the
              "What your customers see" section's id. */}
          <a
            href={hero.secondaryHref}
            className="mt-[calc(var(--gap-body)*.6)] flex w-fit items-center gap-2 text-[15px] font-semibold underline-offset-4 transition-colors duration-200 hover:underline"
            style={{ color: "var(--flow-fg-2)" }}
          >
            {hero.secondaryLabel}
            <span aria-hidden="true" style={{ color: "var(--orange)" }}>
              ↓
            </span>
          </a>
        </ChildStagger>

        {/* The loop: tap -> receipt -> save -> coupon -> scan. */}
        <div className="flex min-w-0 items-center justify-center">
          <LoopVisual summary={summary} clock={clock} />
        </div>
      </div>
    </FlowSection>
  )
}
