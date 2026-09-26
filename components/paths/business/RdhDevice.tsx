import Image from "next/image"
import Link from "next/link"
import { ScrollReveal, ScrollWords } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { NextSection } from "../shared/NextSection"
import { SectionLabel } from "../shared/SectionLabel"
import { howItWorks, rdhDevice } from "./content"
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
// bullets (--fs-lead) all grew.
// Web 2.1 claims pass: the old heading/bullets/spec strip claimed a
// certification, wired ports and a second install mode — none true (see the
// CLAIM RULES in content.ts). It now says what is: Wi-Fi network printer, paper keeps
// printing, no card data (-> /pci, which certifies nothing, so we don't
// either), status light + help (-> /support). Spec strip: Wi-Fi · Network
// printer · Status light.
// Final page order (Nico, 2026-09-24): 04 "Is it safe?", navy between the
// light receipt scene and the light setup -> demo path.
// Web 2.1: the heading moved above the device/bullets row (see below), so the
// row can take the device at full column width.
export function RdhDevice() {
  return (
    <FlowSection ground="navy" index="04" className={`${styles.screen} px-[clamp(20px,5vw,56px)] py-[var(--section-pad-y)]`}>
      <div className="mx-auto w-full max-w-[1200px]">
        {/* The heading spans the screen above the device/bullets row (Web
            2.1): as the right column's first line it capped the whole row at
            the device's height and left the screen ~35% empty. */}
        {/* P3-R1: scroll-linked, in reading order — label, title (word by
            word), then the device beside the bullets, then the spec strip. */}
        <ScrollReveal>
          <SectionLabel index="04">{rdhDevice.eyebrow}</SectionLabel>
        </ScrollReveal>
        <ScrollWords
          as="h2"
          className="max-w-[24ch] text-[length:var(--fs-h2)] font-bold leading-[1.04] tracking-[-.02em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {rdhDevice.heading}
        </ScrollWords>

        <div className="mt-[var(--gap-body)] grid grid-cols-1 items-center gap-[clamp(30px,5vw,70px)] min-[821px]:grid-cols-[56fr_44fr]">
          <ScrollReveal className="flex items-center justify-center">
            <Image
              src="/product/rdh-device.svg"
              alt={rdhDevice.deviceAlt}
              width={700}
              height={570}
              // Width-led, but never so tall that heading + device overflow
              // a short desktop screen (~300px is the label, heading, gap and
              // the section's padding).
              className="h-auto w-full max-w-[700px] object-contain min-[821px]:max-h-[calc(100svh-300px)]"
              style={{ filter: "drop-shadow(0 26px 44px rgba(0,0,0,.45))" }}
            />
          </ScrollReveal>

          <div>
            <ul className="grid gap-[var(--gap-list)]">
              {rdhDevice.points.map((point) => (
                <ScrollReveal as="li" key={point.text} order={1} className="flex items-start gap-3.5">
                  <span aria-hidden="true" className="text-[22px] font-bold leading-[1.35]" style={{ color: "var(--orange)" }}>
                    →
                  </span>
                  <span className="text-[length:var(--fs-lead)] leading-[1.5]" style={{ color: "var(--flow-fg-2)" }}>
                    {point.text}
                    {"link" in point ? (
                      <>
                        {" "}
                        <Link href={point.link.href} className="cursor-pointer whitespace-nowrap" style={{ color: "var(--orange)" }}>
                          {point.link.label} →
                        </Link>
                      </>
                    ) : null}
                  </span>
                </ScrollReveal>
              ))}
            </ul>

            {/* Spec strip — the three facts the bullets already state, set as a
                scannable row. Copy lives in content.ts (rdhDevice.specs). */}
            <ScrollReveal
              order={2}
              className="mt-[var(--gap-body)] flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-[var(--gap-list)] text-[13px] font-semibold uppercase tracking-[.16em]"
              style={{ borderColor: "var(--flow-hair)", color: "var(--flow-fg-3)", fontFamily: "var(--font-label)" }}
            >
              {rdhDevice.specs.map((spec, i) => (
                <span key={spec} className="flex items-center gap-x-4">
                  {i > 0 ? (
                    <span aria-hidden="true" style={{ color: "var(--orange)" }}>
                      ·
                    </span>
                  ) : null}
                  <span>{spec}</span>
                </span>
              ))}
            </ScrollReveal>
          </div>
        </div>
      </div>
      <NextSection targetId={howItWorks.id} name={howItWorks.eyebrow} />
    </FlowSection>
  )
}
