import { cn } from "@/lib/utils"
import { Reveal, WordReveal } from "@/components/motion"
import { whyMerchants } from "./content"
import styles from "./business.module.css"

// 3.2 "Why merchants love PapeX" — a 2x2 `wcard` grid, each card led by a
// numeric claim ($0 / 1 port / 1 tap / 0 rolls). The "Free forever" card is
// the inverted dark lead card, per the prototype's `.wcard.is-lead` +
// `.wc-glow` treatment (PapeX Home.dc.html:230-245, :763-799).
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
            className="text-[clamp(30px,4.6vw,60px)] font-bold leading-[1.04] tracking-[-.02em] [font-family:var(--font-display)]"
          >
            {whyMerchants.heading}
          </WordReveal>
        </Reveal>

        <div className="mt-[clamp(50px,6vw,84px)] grid grid-cols-2 gap-[clamp(16px,1.8vw,22px)] max-[820px]:grid-cols-1">
          {whyMerchants.cards.map((card) => (
            <Reveal key={card.value} as="div" className="flex">
              <div
                className={cn(
                  "relative flex-1 overflow-hidden rounded-[24px] border p-[clamp(32px,3.6vw,46px)]",
                  styles.wcard,
                  card.isLead && styles.wcardLead,
                )}
                style={{
                  background: card.isLead ? "var(--navy)" : "var(--white)",
                  borderColor: card.isLead ? "var(--navy)" : "var(--hairline-1)",
                  boxShadow: card.isLead
                    ? "0 18px 44px rgba(0,18,29,.18)"
                    : "0 12px 30px rgba(0,18,29,.05)",
                }}
              >
                {card.isLead && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute h-[360px] w-[360px] rounded-full"
                    style={{
                      top: -160,
                      right: -130,
                      background: "radial-gradient(circle, rgba(235,113,0,.22), transparent 68%)",
                    }}
                  />
                )}
                <div
                  className="whitespace-nowrap text-[clamp(50px,6.4vw,86px)] font-bold leading-[.92] tracking-[-.03em]"
                  style={{ color: "var(--orange)", fontFamily: "var(--font-display)" }}
                >
                  {card.value}
                </div>
                <div
                  className="my-[22px] h-[3px] w-[46px] rounded-[3px]"
                  style={{ background: "var(--orange)" }}
                />
                <div
                  className="text-[clamp(21px,2.1vw,27px)] font-bold leading-[1.15] tracking-[-.01em]"
                  style={{
                    color: card.isLead ? "var(--offwhite)" : "var(--navy)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {card.title}
                </div>
                <p
                  className="mt-3 max-w-[34ch] text-[16px] leading-[1.55]"
                  style={{ color: card.isLead ? "rgba(245,245,245,.62)" : "#5a5a5a" }}
                >
                  {card.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
