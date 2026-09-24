import Image from "next/image"
import Link from "next/link"
import { Reveal } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { rdhDevice } from "./content"
import styles from "./business.module.css"

// 3.5 The RDH device — NAVY ground since 2026-09-22 (was light). It opens the
// page's second navy block with DashboardPreview: the device is a matte-black
// object with a white label, so navy reads as a product shot rather than a
// box on paper. All copy already uses --flow-* ink; only the drop shadow
// needed swapping (a navy shadow is invisible on navy — it's a lift glow now).
//
// A full screen since 2026-09-22 ("screens, not sections"): it measured 576px
// at 1440x900. `styles.screen` gives it >= 100svh and centres the row; the
// device takes ~58% of a 1200px column at its full width (the old
// max-w-[460px] plus inner padding left it small in a half-screen), and the
// bullets run as a tall column beside it, both vertically centred. Scaled a
// second time the same day: centring alone still read as padding (444px of
// content in 900), so the device, the heading (--fs-h3 -> --fs-h2) and the
// bullets (--fs-lead) all grew. The spec strip under the bullets is NOT new
// copy: "USB", "serial" and "Ethernet" are the ports named verbatim in the
// first bullet, set as a row so the port story is readable at a glance.
export function RdhDevice() {
  return (
    <FlowSection ground="navy" index="04" className={`${styles.screen} px-[clamp(20px,5vw,56px)] py-[var(--section-pad-y)]`}>
      {/* The spec's fixed 1fr/1fr grid needs an explicit single-column
          collapse below the 820px breakpoint. */}
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-[clamp(30px,5vw,70px)] max-[820px]:grid-cols-1 min-[821px]:grid-cols-[58fr_42fr]">
        <Reveal variant="mask" className="flex items-center justify-center py-[clamp(12px,2vw,24px)]">
          <Image
            src="/product/rdh-device.svg"
            alt={rdhDevice.deviceAlt}
            width={700}
            height={570}
            className="h-auto w-full max-w-[700px]"
            style={{ filter: "drop-shadow(0 26px 44px rgba(0,0,0,.45))" }}
          />
        </Reveal>

        <Reveal as="div">
          <SectionLabel index="04">{rdhDevice.eyebrow}</SectionLabel>
          <h2
            className="text-[length:var(--fs-h2)] font-bold leading-[1.04] tracking-[-.02em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {rdhDevice.heading}
          </h2>
          <div className="mt-[var(--gap-body)] grid gap-[var(--gap-list)]">
            {rdhDevice.points.map((point) => (
              <div key={point} className="flex items-start gap-3.5">
                <span aria-hidden="true" className="text-[22px] font-bold leading-[1.35]" style={{ color: "var(--orange)" }}>
                  →
                </span>
                <span className="text-[length:var(--fs-lead)] leading-[1.5]" style={{ color: "var(--flow-fg-2)" }}>
                  {point}
                </span>
              </div>
            ))}
            <div className="flex items-start gap-3.5">
              <span aria-hidden="true" className="text-[22px] font-bold leading-[1.35]" style={{ color: "var(--orange)" }}>
                →
              </span>
              <span className="text-[length:var(--fs-lead)] leading-[1.5]" style={{ color: "var(--flow-fg-2)" }}>
                {rdhDevice.complianceText}{" "}
                <Link href="/pci" className="cursor-pointer" style={{ color: "var(--orange)" }}>
                  {rdhDevice.complianceLinkLabel}
                </Link>
                .
              </span>
            </div>
          </div>

          {/* Spec strip — the ports already named in the first bullet, set as
              a scannable row. No new claim, no new copy in content.ts. */}
          <div
            className="mt-[var(--gap-body)] flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-[var(--gap-list)] text-[13px] font-semibold uppercase tracking-[.16em]"
            style={{ borderColor: "var(--flow-hair)", color: "var(--flow-fg-3)", fontFamily: "var(--font-label)" }}
          >
            <span>USB</span>
            <span aria-hidden="true" style={{ color: "var(--orange)" }}>·</span>
            <span>Serial</span>
            <span aria-hidden="true" style={{ color: "var(--orange)" }}>·</span>
            <span>Ethernet</span>
          </div>
        </Reveal>
      </div>
    </FlowSection>
  )
}
