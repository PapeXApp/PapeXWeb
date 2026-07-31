import { Reveal, WordReveal } from "@/components/motion"
import { howItWorks } from "./content"

export function HowItWorks() {
  return (
    <section
      data-nav-theme="dark"
      className="px-[clamp(20px,5vw,56px)] py-[clamp(90px,11vw,160px)]"
      style={{ background: "var(--navy)", color: "var(--offwhite)" }}
    >
      <div className="mx-auto max-w-[1100px]">
        <Reveal>
          <WordReveal
            as="h2"
            className="mx-auto max-w-[22ch] text-center text-[clamp(30px,4.4vw,58px)] font-bold leading-[1.03] tracking-[-.02em] [font-family:var(--font-display)]"
          >
            {howItWorks.heading}
          </WordReveal>
        </Reveal>

        <div className="mt-[clamp(50px,6vw,80px)] grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[clamp(20px,3vw,36px)]">
          {howItWorks.steps.map((step) => (
            <Reveal key={step.number} as="div">
              <div
                className="text-[34px] font-bold"
                style={{ color: "var(--orange)", fontFamily: "var(--font-display)" }}
              >
                {step.number}
              </div>
              <h4
                className="mt-3 text-[19px] font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {step.title}
              </h4>
              <p className="mt-2 text-[15px] leading-[1.5]" style={{ color: "var(--muted-on-dark)" }}>
                {step.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
