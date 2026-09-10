import { cn } from "@/lib/utils"
import { Reveal, ScrollLit } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { PointerLitGroup } from "../shared/PointerLit"
import { SectionLabel } from "../shared/SectionLabel"
import { whyMerchants } from "./content"
import styles from "./business.module.css"

// 3.2 "Why merchants love PapeX" — a 2x2 `wcard` grid, each card led by a
// numeric claim ($0 / 1 port / 1 tap / 0 rolls). The "Free forever" card is
// the inverted dark lead card, per the prototype's `.wcard.is-lead` +
// `.wc-glow` treatment (PapeX Home.dc.html:230-245, :763-799).
//
// The heading is this path's one ScrollLit statement (the section has no
// separate lead paragraph): its words light up as it scrolls through.
// Cards are pointer-lit; `data-lit` sits on the card INSIDE each Reveal so
// the reveal's inline transform never fights the card's :hover lift.
export function WhyMerchants() {
  return (
    <FlowSection
      ground="light"
      index="02"
      className="px-[clamp(20px,5vw,56px)] pb-[clamp(64px,7vw,110px)] pt-[clamp(90px,11vw,160px)]"
    >
      <div className="mx-auto max-w-[1150px]">
        <Reveal>
          <SectionLabel index="02">{whyMerchants.eyebrow}</SectionLabel>
          <ScrollLit
            as="h2"
            text={whyMerchants.heading}
            className="max-w-[18ch] text-[clamp(30px,4.6vw,60px)] font-bold leading-[1.04] tracking-[-.02em] [font-family:var(--font-display)]"
          />
        </Reveal>

        <PointerLitGroup className="mt-[clamp(50px,6vw,84px)] grid grid-cols-2 gap-[clamp(16px,1.8vw,22px)] max-[820px]:grid-cols-1">
          {whyMerchants.cards.map((card, index) => (
            <Reveal key={card.value} as="div" className="flex" delay={(index % 2) * 0.08}>
              <div
                data-lit={card.isLead ? "dark" : ""}
                className={cn(
                  "relative flex-1 overflow-hidden rounded-[20px] border p-[clamp(32px,3.6vw,46px)]",
                  styles.wcard,
                  card.isLead && styles.wcardLead,
                )}
                style={{
                  background: card.isLead ? "var(--navy)" : "var(--white)",
                  borderColor: card.isLead ? "rgba(245,245,245,.08)" : "var(--on-light-border)",
                  boxShadow: card.isLead
                    ? "0 18px 44px rgba(0,18,29,.16)"
                    : "0 1px 2px rgba(0,18,29,.04), 0 10px 26px rgba(0,18,29,.04)",
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
                  className="whitespace-nowrap text-[clamp(50px,6.4vw,86px)] font-bold leading-[.92] tracking-[-.03em] [font-variant-numeric:tabular-nums]"
                  style={{ color: "var(--orange)", fontFamily: "var(--font-display)" }}
                >
                  {card.value}
                </div>
                <div className="my-[22px] h-px w-[46px]" style={{ background: "var(--orange)" }} />
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
                  style={{ color: card.isLead ? "rgba(245,245,245,.64)" : "var(--on-light-text)" }}
                >
                  {card.body}
                </p>
              </div>
            </Reveal>
          ))}
        </PointerLitGroup>
      </div>
    </FlowSection>
  )
}
