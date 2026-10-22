import Image from "next/image"
import Link from "next/link"
import { ScrollReveal, ScrollWords } from "@/components/motion"
import { FlowSection } from "../shared/FlowSection"
import { NextSection } from "../shared/NextSection"
import { SectionLabel } from "../shared/SectionLabel"
import { howItWorks, rdsSticker } from "./content"
import styles from "./business.module.css"

// 3.5 The RDS sticker (Receipt Delivery Sticker) — NAVY ground since
// 2026-09-22 (was light). It opens the page's second navy block with
// DashboardPreview: the sticker is dark navy with orange "TAP HERE" and a
// white wordmark, so navy reads as a product shot. All copy uses --flow-*
// ink; the drop shadow is a black lift (a navy shadow is invisible on navy).
//
// A full screen since 2026-09-22 ("screens, not sections"). `styles.screen`
// gives it >= 100svh and centres the row; the sticker takes ~56% of a 1200px
// column and the bullets run as a tall column beside it, both vertically
// centred. The heading (--fs-h2) and bullets (--fs-lead) are sized for a
// full screen, not a half.
// Web 2.2 (2026-10-21): the box became a passive NFC sticker. A sticker
// alone, flat, read as nothing to a new visitor (Nico: "put the sticker on a
// counter top"), so the art is public/product/rds-counter.webp (1400x1009,
// transparent; scripts/generate-rds-counter.mjs): the sticker lying on a
// store countertop by its customer edge, a card terminal beside it, in the
// same true-isometric camera the old box used. The counter brings its own
// thickness and contact shadows, so the lift here is short and soft, and
// the phone cap stays at 280px. Copy (content.ts rdsSticker) says what is:
// no box/cables/Wi-Fi, the POS handles card data (-> /pci), paper keeps
// printing, one sticker per register.
// Final page order (Nico, 2026-09-24): 04 "Is it safe?", navy between the
// light receipt scene and the light setup -> demo path.
// Web 2.1: the heading sits above the sticker/bullets row (see below), so
// the row can take the sticker at full column width.
export function RdsSticker() {
  return (
    <FlowSection ground="navy" index="04" className={`${styles.screen} px-[clamp(20px,5vw,56px)] py-[var(--section-pad-y)]`}>
      <div className="mx-auto w-full max-w-[1200px]">
        {/* The heading spans the screen above the sticker/bullets row (Web
            2.1): as the right column's first line it capped the whole row at
            the art's height and left the screen ~35% empty. */}
        {/* P3-R1: scroll-linked, in reading order — label, title (word by
            word), then the sticker beside the bullets, then the spec strip. */}
        <ScrollReveal>
          <SectionLabel index="04">{rdsSticker.eyebrow}</SectionLabel>
        </ScrollReveal>
        <ScrollWords
          as="h2"
          className="max-w-[24ch] text-[length:var(--fs-h2)] font-bold leading-[1.04] tracking-[-.02em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {rdsSticker.heading}
        </ScrollWords>

        <div className="mt-[var(--gap-body)] grid grid-cols-1 items-center gap-[clamp(30px,5vw,70px)] min-[821px]:grid-cols-[56fr_44fr]">
          <ScrollReveal className="flex items-center justify-center">
            <Image
              src="/product/rds-counter.webp"
              alt={rdsSticker.stickerAlt}
              width={1400}
              height={1009}
              // Width-led, but never so tall that heading + sticker overflow
              // a short desktop screen (~300px is the label, heading, gap and
              // the section's padding).
              // p8: on phones it stays capped at 280px so the heading,
              // sticker and bullets read as one calm screen.
              className="h-auto w-full max-w-[280px] object-contain min-[821px]:max-h-[calc(100svh-300px)] min-[821px]:max-w-[700px]"
              // A slab on the navy: a short, soft lift under its front
              // edge (the art draws its own contact shadows on the counter).
              style={{ filter: "drop-shadow(0 18px 30px rgba(0,0,0,.45))" }}
            />
          </ScrollReveal>

          <div>
            <ul className="grid gap-[var(--gap-list)]">
              {rdsSticker.points.map((point) => (
                <ScrollReveal as="li" key={point.text} order={1} className="flex items-start gap-3.5">
                  <span aria-hidden="true" className="text-[22px] font-bold leading-[1.35]" style={{ color: "var(--orange)" }}>
                    →
                  </span>
                  <span className="text-[length:var(--fs-lead)] leading-[1.5]" style={{ color: "var(--flow-fg-2)" }}>
                    {point.text}
                    {"link" in point ? (
                      <>
                        {" "}
                        <Link href={point.link.href} className={`${styles.hitInline} cursor-pointer whitespace-nowrap`} style={{ color: "var(--orange)" }}>
                          {point.link.label} →
                        </Link>
                      </>
                    ) : null}
                  </span>
                </ScrollReveal>
              ))}
            </ul>

            {/* Spec strip — the three facts the bullets already state, set as a
                scannable row. Copy lives in content.ts (rdsSticker.specs). */}
            <ScrollReveal
              order={2}
              // p8: on phones the row wraps, and the "·" (glued to the
              // following spec) started the second line on its own. Phones
              // drop the dots and let the specs wrap as separate words.
              className="mt-[var(--gap-body)] flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-[var(--gap-list)] text-[13px] font-semibold uppercase tracking-[.16em] min-[821px]:gap-x-4"
              style={{ borderColor: "var(--flow-hair)", color: "var(--flow-fg-3)", fontFamily: "var(--font-label)" }}
            >
              {rdsSticker.specs.map((spec, i) => (
                <span key={spec} className="flex items-center gap-x-4">
                  {i > 0 ? (
                    <span aria-hidden="true" className="hidden min-[821px]:inline" style={{ color: "var(--orange)" }}>
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
