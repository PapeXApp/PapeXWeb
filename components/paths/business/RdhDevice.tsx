import Image from "next/image"
import Link from "next/link"
import { Reveal } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { rdhDevice } from "./content"

// 3.5 The RDH device — NAVY ground since 2026-09-22 (was light). It opens the
// page's second navy block with DashboardPreview: the device is a matte-black
// object with a white label, so navy reads as a product shot rather than a
// box on paper. All copy already uses --flow-* ink; only the drop shadow
// needed swapping (a navy shadow is invisible on navy — it's a lift glow now).
export function RdhDevice() {
  return (
    <FlowSection ground="navy" index="04" className="px-[clamp(20px,5vw,56px)] py-[var(--section-pad-y)]">
      {/* The spec's fixed 1fr/1fr grid needs an explicit single-column
          collapse below the 820px breakpoint. */}
      <div className="mx-auto grid max-w-[1150px] grid-cols-1 items-center gap-[clamp(30px,5vw,70px)] max-[820px]:grid-cols-1 min-[821px]:grid-cols-2">
        <Reveal variant="mask" className="flex items-center justify-center p-[clamp(20px,4vw,44px)]">
          <Image
            src="/product/rdh-device.svg"
            alt={rdhDevice.deviceAlt}
            width={460}
            height={374}
            className="h-auto w-full max-w-[460px]"
            style={{ filter: "drop-shadow(0 26px 44px rgba(0,0,0,.45))" }}
          />
        </Reveal>

        <Reveal as="div">
          <SectionLabel index="04">{rdhDevice.eyebrow}</SectionLabel>
          <h2
            className="text-[length:var(--fs-h3)] font-bold leading-[1.03] tracking-[-.02em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {rdhDevice.heading}
          </h2>
          <div className="mt-[26px] grid gap-3.5">
            {rdhDevice.points.map((point) => (
              <div key={point} className="flex items-start gap-3.5">
                <span aria-hidden="true" className="text-[18px] font-bold leading-[1.4]" style={{ color: "var(--orange)" }}>
                  →
                </span>
                <span className="text-[16px] leading-[1.45]" style={{ color: "var(--flow-fg-2)" }}>
                  {point}
                </span>
              </div>
            ))}
            <div className="flex items-start gap-3.5">
              <span aria-hidden="true" className="text-[18px] font-bold leading-[1.4]" style={{ color: "var(--orange)" }}>
                →
              </span>
              <span className="text-[16px] leading-[1.45]" style={{ color: "var(--flow-fg-2)" }}>
                {rdhDevice.complianceText}{" "}
                <Link href="/pci" className="cursor-pointer" style={{ color: "var(--orange)" }}>
                  {rdhDevice.complianceLinkLabel}
                </Link>
                .
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </FlowSection>
  )
}
