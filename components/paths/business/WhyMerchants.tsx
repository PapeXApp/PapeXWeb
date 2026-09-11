import { Reveal, ScrollLit } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { whyMerchants } from "./content"
import { CrumpleReceipt } from "./CrumpleReceipt"

// 3.2 "Why merchants love PapeX" — the four numeric claims ($0 / 1 port /
// 1 tap / 0 rolls) used to sit in a static 2x2 `wcard` grid. They are now the
// line items on a receipt that prints, gets crumpled, and gets binned, after
// which the same four re-form as cards (CrumpleReceipt.tsx owns all of it,
// including the cards, so the claims have exactly one source in content.ts).
//
// The heading is still this path's one ScrollLit statement: its words light up
// as it scrolls through.
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

        <CrumpleReceipt />
      </div>
    </FlowSection>
  )
}
