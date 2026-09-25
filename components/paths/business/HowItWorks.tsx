import { Reveal, WordReveal } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { howItWorks } from "./content"
import { SetupTimeline } from "./setup/SetupTimeline"
import styles from "./business.module.css"

// 05 "How do I get it?" (#setup) — Web 2.1 W3 (Nico, 2026-09-24).
//
// The five install steps used to be five numbered bubbles on a dashed rail
// ("looks the least professional, most vibe coded"). They are a timeline with
// a line illustration per step. Since Web 2.1 P3-B3 (Nico, 2026-09-25) the
// whole row is on screen from the start and LIGHTS UP as you scroll — the
// orange line runs to each step, its number turns orange, its art draws in and
// its words rise — and nothing slides away (the old travel + zoom left blank
// space). Desktop pins it; phones light each step as it scrolls past.
// The scene lives in ./setup/ (SetupTimeline.tsx has the beat sheet).
//
// LIGHT ground (unchanged), same as the demo form it flows into, so setup ->
// demo reads as one path. `id="setup"` is the footer's "Integration" target.
// The heading stays the section's h2 and each step's title an h3 inside one
// real <ol>; the header rides inside the pin so the title and the row read as
// one screen.
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
