import Image from "next/image"
import { Reveal, WordReveal } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { dashboard } from "./content"

// 3.6 Merchant dashboard — navy ground. A real screenshot of the shipping
// dashboard plus three feature columns (PapeX Home.dc.html:872-907).
// DashboardNotifyForm.tsx stays in the tree, unreferenced, per this path's
// additive-only rule.
//
// Header, screenshot and columns each reveal on their own: one Reveal around
// the whole block would blur a 2880px image and everything with it for 700ms.
export function DashboardPreview() {
  return (
    <FlowSection ground="navy" index="05" className="px-[clamp(20px,5vw,56px)] py-[clamp(90px,11vw,160px)]">
      <div className="mx-auto max-w-[1080px]">
        <Reveal as="div" className="text-center">
          <SectionLabel index="05">{dashboard.eyebrow}</SectionLabel>
          <WordReveal
            as="h2"
            className="mx-auto max-w-[22ch] text-[clamp(30px,4.4vw,58px)] font-bold leading-[1.03] tracking-[-.02em] [font-family:var(--font-display)]"
          >
            {dashboard.heading}
          </WordReveal>
          <p className="mx-auto mt-5 max-w-[56ch] text-[17px] leading-[1.55]" style={{ color: "var(--flow-fg-2)" }}>
            {dashboard.lead}
          </p>
        </Reveal>

        <Reveal
          variant="mask"
          className="mt-[clamp(40px,5vw,60px)] overflow-hidden rounded-[16px] border"
          style={{ borderColor: "rgba(255,255,255,.1)", boxShadow: "0 30px 70px rgba(0,0,0,.35)" }}
        >
          <Image
            src="/product/merchant-dashboard.png"
            alt={dashboard.dashboardAlt}
            width={2880}
            height={1800}
            className="block h-auto w-full"
          />
        </Reveal>

        <div className="mt-[clamp(40px,5vw,60px)] grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[clamp(24px,3vw,44px)]">
          {dashboard.columns.map((column, index) => (
            <Reveal key={column.title} as="div" delay={index * 0.08}>
              <div className="mb-4 h-px w-10" style={{ background: "var(--orange)" }} />
              <h3 className="text-[20px] font-bold leading-[1.2]" style={{ fontFamily: "var(--font-display)" }}>
                {column.title}
              </h3>
              <p className="mt-2.5 text-[15.5px] leading-[1.55]" style={{ color: "var(--flow-fg-2)" }}>
                {column.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </FlowSection>
  )
}
