import { Reveal, WordReveal } from "@/components/motion"
import { howItWorks } from "./content"
import styles from "./business.module.css"

// 3.4 "Getting set up" — an `.rmap` roadmap: numbered dots joined by a dashed
// connector (PapeX Home.dc.html:248-252, :823-855). Replaces the previous
// plain 4-up numeral list.
export function HowItWorks() {
  return (
    <section
      data-nav-theme="dark"
      className="px-[clamp(20px,5vw,56px)] py-[clamp(90px,11vw,160px)]"
      style={{ background: "var(--navy)", color: "var(--offwhite)" }}
    >
      <div className="mx-auto max-w-[1100px]">
        <Reveal className="max-w-[760px]">
          <div
            className="mb-[18px] text-[13px] font-semibold uppercase tracking-[.24em]"
            style={{ color: "var(--orange)" }}
          >
            {howItWorks.eyebrow}
          </div>
          <WordReveal
            as="h2"
            className="text-[clamp(30px,4.6vw,60px)] font-bold leading-[1.04] tracking-[-.02em] [font-family:var(--font-display)]"
          >
            {howItWorks.heading}
          </WordReveal>
          <p
            className="mt-[18px] max-w-[52ch] text-[17px] leading-[1.55]"
            style={{ color: "rgba(245,245,245,.62)" }}
          >
            {howItWorks.lead}
          </p>
        </Reveal>

        <div className="mt-[clamp(52px,6vw,84px)] grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-[clamp(24px,3vw,34px)]">
          {howItWorks.steps.map((step) => (
            <Reveal key={step.number} as="div" className={`${styles.rmapNode} pt-1`}>
              <div
                className="relative z-[2] flex h-14 w-14 items-center justify-center rounded-full text-[19px] font-bold"
                style={{
                  background: "var(--navy)",
                  border: "2px solid var(--orange)",
                  color: "var(--orange)",
                  fontFamily: "var(--font-display)",
                  boxShadow: "0 0 0 8px var(--navy)",
                }}
              >
                {step.number}
              </div>
              <h4
                className="mt-[18px] text-[19px] font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {step.title}
              </h4>
              <p
                className="mt-2 max-w-[26ch] text-[15px] leading-[1.5]"
                style={{ color: "rgba(245,245,245,.6)" }}
              >
                {step.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
