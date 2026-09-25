import { Reveal, WordReveal } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { howItWorks } from "./content"
import { SetupTimeline } from "./setup/SetupTimeline"
import styles from "./business.module.css"

// 05 "How do I get it?" (#setup) — Web 2.1 W3 (Nico, 2026-09-24).
//
// The five install steps used to be five numbered bubbles on a dashed rail
// ("looks the least professional, most vibe coded"). They are now a pinned,
// scroll-driven horizontal timeline with a line illustration per step: the
// chain slides left one step at a time as you scroll, then zooms back out to
// show all five before the pin releases into the demo form (#demo) below.
// The scene lives in ./setup/ (SetupTimeline.tsx has the beat sheet).
//
// LIGHT ground (unchanged), same as the demo form it flows into, so setup ->
// demo reads as one path. `id="setup"` is the footer's "Integration" target.
// The heading stays the section's h2 and each step's title an h3 inside one
// real <ol>; the header rides inside the pin so it stays on screen while the
// steps move.
export function HowItWorks() {
  const header = (
    <Reveal className="max-w-[820px]">
      <SectionLabel index="05">{howItWorks.eyebrow}</SectionLabel>
      <WordReveal
        as="h2"
        className="text-[length:var(--fs-h1-merchant)] font-bold leading-[1.03] tracking-[-.02em] [font-family:var(--font-display)]"
      >
        {howItWorks.heading}
      </WordReveal>
      <p className="mt-[clamp(12px,1.6vw,22px)] max-w-[44ch] text-[length:var(--fs-lead)] leading-[1.5]" style={{ color: "var(--flow-fg-2)" }}>
        {howItWorks.lead}
      </p>
    </Reveal>
  )

  return (
    <FlowSection id={howItWorks.id} ground="light" index="05" className={`${styles.rhythm} scroll-mt-[40px]`}>
      <SetupTimeline
        header={header}
        steps={howItWorks.steps}
        axisStart={howItWorks.axisStart}
        axisEnd={howItWorks.axisEnd}
        nextLabel={howItWorks.nextLabel}
        nextHref={howItWorks.nextHref}
      />
    </FlowSection>
  )
}
