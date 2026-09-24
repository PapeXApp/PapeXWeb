import Image from "next/image"
import { Reveal, WordReveal } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { dashboard } from "./content"
import styles from "./business.module.css"

// 3.6 Merchant dashboard — navy ground. A real screenshot of the shipping
// dashboard plus three feature columns (PapeX Home.dc.html:872-907).
// DashboardNotifyForm.tsx stays in the tree, unreferenced, per this path's
// additive-only rule.
//
// Header, screenshot and columns each reveal on their own: one Reveal around
// the whole block would blur a 2880px image and everything with it for 700ms.
//
// This one already ran past a screen (heading + a 1080x675 screenshot + the
// three columns is ~1300px at 1440x900), so `styles.screen` is a floor, not a
// change: it guarantees the minimum even on a short/wide window, and the
// columns deliberately read as the lower half of the second screen — one
// heading for the whole stretch, which is what "screens, not sections" asks.
export function DashboardPreview() {
  return (
    <FlowSection ground="navy" index="05" className={`${styles.screen} px-[clamp(20px,5vw,56px)] py-[var(--section-pad-y)]`}>
      <div className="mx-auto max-w-[1080px]">
        <Reveal as="div" className="text-center">
          <SectionLabel index="05">{dashboard.eyebrow}</SectionLabel>
          <WordReveal
            as="h2"
            className="mx-auto max-w-[22ch] text-[length:var(--fs-h2)] font-bold leading-[1.03] tracking-[-.02em] [font-family:var(--font-display)]"
          >
            {dashboard.heading}
          </WordReveal>
          <p className="mx-auto mt-[var(--gap-title)] max-w-[56ch] text-[length:var(--fs-lead)] leading-[1.55]" style={{ color: "var(--flow-fg-2)" }}>
            {dashboard.lead}
          </p>
        </Reveal>

        <Reveal
          variant="mask"
          className="mt-[calc(var(--gap-body)*1.5)] overflow-hidden rounded-[16px] border"
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

        <div className="mt-[calc(var(--gap-body)*1.5)] grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[clamp(24px,3vw,44px)]">
          {dashboard.columns.map((column, index) => (
            <Reveal key={column.title} as="div" delay={index * 0.08}>
              <div className="mb-4 h-px w-10" style={{ background: "var(--orange)" }} />
              <h3 className="text-[20px] font-bold leading-[1.2]" style={{ fontFamily: "var(--font-display)" }}>
                {column.title}
              </h3>
              <p className="mt-[var(--gap-list)] text-[15.5px] leading-[1.55]" style={{ color: "var(--flow-fg-2)" }}>
                {column.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </FlowSection>
  )
}
