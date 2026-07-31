import { Reveal, WordReveal } from "@/components/motion"
import { whyMerchants } from "./content"

export function WhyMerchants() {
  return (
    <section
      data-nav-theme="light"
      className="px-[clamp(20px,5vw,56px)] py-[clamp(90px,11vw,160px)]"
      style={{ background: "var(--offwhite)", color: "var(--ink)" }}
    >
      <div className="mx-auto max-w-[1150px]">
        <Reveal>
          <div
            className="mb-[18px] text-[13px] font-semibold uppercase tracking-[.24em]"
            style={{ color: "var(--orange)" }}
          >
            {whyMerchants.eyebrow}
          </div>
          <WordReveal
            as="h2"
            className="max-w-[22ch] text-[clamp(30px,4.4vw,58px)] font-bold leading-[1.03] tracking-[-.02em] [font-family:var(--font-display)]"
          >
            {whyMerchants.heading}
          </WordReveal>
        </Reveal>

        <div className="mt-[clamp(50px,6vw,80px)] grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[clamp(16px,2vw,24px)]">
          {whyMerchants.cards.map((card) => (
            <Reveal
              key={card.title}
              as="div"
              className="rounded-[18px] bg-white p-[30px]"
              style={{ boxShadow: "0 12px 30px rgba(0,18,29,.05)" }}
            >
              <div
                className="text-[22px] font-bold"
                style={{ color: "var(--orange)", fontFamily: "var(--font-display)" }}
              >
                {card.title}
              </div>
              <p className="mt-3 text-[15px] leading-[1.5]" style={{ color: "#5a5a5a" }}>
                {card.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
