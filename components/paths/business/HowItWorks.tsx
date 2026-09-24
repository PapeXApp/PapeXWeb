import { Reveal, WordReveal } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { howItWorks } from "./content"
import styles from "./business.module.css"

// 3.4 "Getting set up" — an `.rmap` roadmap: numbered dots joined by a dashed
// connector (PapeX Home.dc.html:248-252, :823-855). The dots are filled with
// the running ground (and ringed with it, to mask the connector behind them),
// so they stay correct while the page ground crossfades.
//
// LIGHT ground since 2026-09-22 (was navy): the business page's colour story
// is now navy · light · light · navy · navy · light · navy, so Why and How
// run as one light stretch before the RDH/dashboard navy block. Every ink
// here is already a --flow-* var and the step dots/dashed connector are
// orange, which is the brand's on-light accent — nothing to recolour.
//
// A full screen since 2026-09-22 ("screens, not sections"): it measured 597px
// at 1440x900, so the viewport always carried this heading and the next one.
// `styles.screen` gives it >= 100svh and centres the block; the timeline is
// pinned to exactly four columns >= 821px (auto-fit could drop to three and
// break the one-row read) and the numerals/step type are scaled up so the
// extra height is spent on the content, not on margins.
export function HowItWorks() {
  return (
    <FlowSection
      ground="light"
      index="03"
      className={`${styles.screen} px-[clamp(20px,5vw,56px)] py-[var(--section-pad-y)]`}
    >
      <div className="mx-auto max-w-[1100px]">
        <Reveal className="max-w-[760px]">
          <SectionLabel index="03">{howItWorks.eyebrow}</SectionLabel>
          <WordReveal
            as="h2"
            className="text-[length:var(--fs-h2)] font-bold leading-[1.04] tracking-[-.02em] [font-family:var(--font-display)]"
          >
            {howItWorks.heading}
          </WordReveal>
          <p className="mt-[var(--gap-title)] max-w-[52ch] text-[length:var(--fs-lead)] leading-[1.55]" style={{ color: "var(--flow-fg-2)" }}>
            {howItWorks.lead}
          </p>
        </Reveal>

        <div className="mt-[calc(var(--gap-body)*2)] grid grid-cols-1 gap-[clamp(24px,3vw,34px)] min-[821px]:grid-cols-4">
          {howItWorks.steps.map((step, index) => (
            <Reveal key={step.number} as="div" delay={index * 0.08} className={`${styles.rmapNode} pt-1`}>
              <div
                className="relative z-[2] flex h-[72px] w-[72px] items-center justify-center rounded-full text-[26px] font-bold"
                style={{
                  background: "var(--flow-ground)",
                  border: "1.5px solid var(--orange)",
                  color: "var(--orange)",
                  fontFamily: "var(--font-display)",
                  boxShadow: "0 0 0 8px var(--flow-ground)",
                }}
              >
                {step.number}
              </div>
              <h3
                className="mt-[var(--gap-list)] text-[length:var(--fs-step-title)] font-semibold leading-[1.15]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {step.title}
              </h3>
              <p className="mt-[var(--gap-list)] max-w-[26ch] text-[16.5px] leading-[1.55]" style={{ color: "var(--flow-fg-2)" }}>
                {step.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </FlowSection>
  )
}
