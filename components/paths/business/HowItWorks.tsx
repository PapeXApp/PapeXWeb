import { Reveal, WordReveal } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { howItWorks } from "./content"
import styles from "./business.module.css"

// 3.4 "Getting set up" — an `.rmap` roadmap: numbered dots joined by a dashed
// connector (PapeX Home.dc.html:248-252, :823-855). The dots are filled with
// the running ground (and ringed with it, to mask the connector behind them),
// so they stay correct while the page ground crossfades.
export function HowItWorks() {
  return (
    <FlowSection
      ground="navy"
      index="03"
      className="px-[clamp(20px,5vw,56px)] pb-[clamp(90px,11vw,160px)] pt-[clamp(64px,7vw,110px)]"
    >
      <div className="mx-auto max-w-[1100px]">
        <Reveal className="max-w-[760px]">
          <SectionLabel index="03">{howItWorks.eyebrow}</SectionLabel>
          <WordReveal
            as="h2"
            className="text-[clamp(30px,4.6vw,60px)] font-bold leading-[1.04] tracking-[-.02em] [font-family:var(--font-display)]"
          >
            {howItWorks.heading}
          </WordReveal>
          <p className="mt-[18px] max-w-[52ch] text-[17px] leading-[1.55]" style={{ color: "var(--flow-fg-2)" }}>
            {howItWorks.lead}
          </p>
        </Reveal>

        <div className="mt-[clamp(52px,6vw,84px)] grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-[clamp(24px,3vw,34px)]">
          {howItWorks.steps.map((step, index) => (
            <Reveal key={step.number} as="div" delay={index * 0.08} className={`${styles.rmapNode} pt-1`}>
              <div
                className="relative z-[2] flex h-14 w-14 items-center justify-center rounded-full text-[19px] font-bold"
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
              <h4 className="mt-[18px] text-[19px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                {step.title}
              </h4>
              <p className="mt-2 max-w-[26ch] text-[15px] leading-[1.5]" style={{ color: "var(--flow-fg-2)" }}>
                {step.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </FlowSection>
  )
}
