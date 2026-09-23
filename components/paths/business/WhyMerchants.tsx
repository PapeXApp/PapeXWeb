import { Reveal, ScrollLit } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { whyMerchants } from "./content"
import { FoldReceipt } from "./FoldReceipt"

// 3.2 "Why merchants love PapeX" — the four numeric claims ($0 / 1 port /
// 1 tap / 0 rolls) used to sit in a static 2x2 `wcard` grid. They are now the
// line items on a receipt that prints, then folds into the PapeX plane and
// flies into the bin (FoldReceipt.tsx owns all of it, so the claims have
// exactly one source in content.ts). There is nothing under it: the receipt
// is the section.
//
// The heading is still this path's one ScrollLit statement: its words light up
// as it scrolls through.
export function WhyMerchants() {
  return (
    <FlowSection
      ground="light"
      index="02"
      className="px-[clamp(20px,5vw,56px)] py-[var(--section-pad-y)]"
    >
      <div className="mx-auto max-w-[1150px]">
        <Reveal>
          <SectionLabel index="02">{whyMerchants.eyebrow}</SectionLabel>
          <ScrollLit
            as="h2"
            text={whyMerchants.heading}
            className="max-w-[18ch] text-[length:var(--fs-h2)] font-bold leading-[1.04] tracking-[-.02em] [font-family:var(--font-display)]"
          />
        </Reveal>

        <FoldReceipt />
      </div>
    </FlowSection>
  )
}
