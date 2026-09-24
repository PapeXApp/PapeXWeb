"use client"

import Image from "next/image"
import { useState } from "react"
import { LayoutDashboard } from "lucide-react"
import { Reveal, WordReveal } from "@/components/motion"
import { cn } from "@/lib/utils"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { tapToRetain } from "./content"
import bstyles from "./business.module.css"
import styles from "./tapToRetain.module.css"

type Half = (typeof tapToRetain.halves)[number]["key"]

// 02 "What is Tap to Retain?" — LIGHT ground (the hero above is navy).
//
// One screen, two halves, both always readable: the two cards on the right
// ARE the explanation; the stage on the left only illustrates the half you
// picked. Picking is the fun part: the stage runs a small loop —
//   Receipts: a slip leaves YOUR COUNTER (the PapeX device, with a tap
//             ripple) and lands in THEIR PAPEX APP.
//   Coupons:  a coupon leaves YOUR DASHBOARD and lands in their app; the
//             dashboard carries the "Coming soon" tag and the coupon is drawn
//             dashed, because only that leg is not live.
// Motion is CSS keyframes on transform/opacity only (tapToRetain.module.css);
// the key on the token restarts the loop when you switch halves. Under
// prefers-reduced-motion the loop is off and the token simply rests in the
// phone, so the picture still says where it ends up.
export function TapToRetain() {
  const [half, setHalf] = useState<Half>("receipts")
  const t = tapToRetain

  return (
    <FlowSection
      ground="light"
      index="02"
      className={`${bstyles.screen} px-[clamp(20px,5vw,56px)] py-[var(--section-pad-y)]`}
    >
      <div className="mx-auto w-full max-w-[1150px]">
        <Reveal className="max-w-[820px]">
          <SectionLabel index="02">{t.eyebrow}</SectionLabel>
          <WordReveal
            as="h2"
            className="text-[length:var(--fs-h2)] font-bold leading-[1.04] tracking-[-.02em] [font-family:var(--font-display)]"
          >
            {t.heading}
          </WordReveal>
          <p
            className="mt-[var(--gap-title)] max-w-[52ch] text-[length:var(--fs-lead)] leading-[1.55]"
            style={{ color: "var(--flow-fg-2)" }}
          >
            {t.lead}
          </p>
        </Reveal>

        <div className="mt-[var(--gap-body)] grid grid-cols-1 items-center gap-[clamp(24px,4vw,56px)] min-[900px]:grid-cols-[1.1fr_.9fr]">
          {/* The stage: decorative, the cards carry the words. */}
          <Reveal as="div">
            <div className={styles.stage} data-half={half} aria-hidden="true">
              <div className={styles.stations}>
                <div className={cn(styles.station, half === "coupons" && styles.dim)}>
                  <div className={styles.deviceWrap}>
                    <span key={`ripple-${half}`} className={styles.ripple} />
                    <Image src="/product/rdh-device.svg" alt="" width={120} height={98} className={styles.device} />
                  </div>
                  <span className={styles.stationLabel}>{t.stations.counter}</span>
                </div>

                <div className={styles.station}>
                  <div className={styles.phone}>
                    <span className={styles.island} />
                    <span className={styles.row} />
                    <span className={styles.row} />
                    <span className={cn(styles.row, styles.rowShort)} />
                  </div>
                  <span className={styles.stationLabel}>{t.stations.phone}</span>
                </div>

                <div className={cn(styles.station, half === "receipts" && styles.dim)}>
                  <div className={styles.dash}>
                    <LayoutDashboard size={34} strokeWidth={1.6} />
                    <span className={cn(styles.soonTag, half === "coupons" && styles.soonTagOn)}>{t.comingSoon}</span>
                  </div>
                  <span className={styles.stationLabel}>{t.stations.dashboard}</span>
                </div>
              </div>

              {/* The travelling token: a full-width lane moved in thirds of the
                  stage, so it starts centred on one station and lands centred
                  on the phone at any width. */}
              <div key={`token-${half}`} className={cn(styles.lane, half === "receipts" ? styles.fromLeft : styles.fromRight)}>
                <div className={styles.hop}>
                  {half === "receipts" ? (
                    <div className={styles.slip}>
                      <span className={styles.slipHead}>{t.tokens.receipt}</span>
                      <span className={styles.slipLine} />
                      <span className={styles.slipLine} />
                      <span className={cn(styles.slipLine, styles.slipLineShort)} />
                    </div>
                  ) : (
                    <div className={styles.coupon}>
                      <span>{t.tokens.coupon}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Reveal>

          {/* The two halves. Real buttons: they choose what the stage shows,
              and their text is the whole explanation either way. */}
          <div className="grid gap-[var(--gap-list)]" role="group" aria-label={t.eyebrow}>
            {t.halves.map((h) => {
              const active = half === h.key
              return (
                <button
                  key={h.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setHalf(h.key)}
                  className={cn(styles.card, active && styles.cardOn)}
                >
                  <span className={styles.cardTitle}>{h.title}</span>
                  <span className={styles.cardBody}>
                    {h.live}
                    {"soon" in h ? (
                      <>
                        {" "}
                        <span className={styles.soonPill}>{t.comingSoon}</span> {h.soon}
                      </>
                    ) : null}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </FlowSection>
  )
}
