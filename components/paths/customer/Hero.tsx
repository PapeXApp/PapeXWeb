"use client";

import { ChildStagger, Magnetic, Ripple, Spotlight, WordReveal } from "@/components/motion";
import { APP_STORE_URL } from "@/components/brand/links";
import { FlowSection } from "../shared/FlowSection";
import { SectionLabel } from "../shared/SectionLabel";
import { heroContent } from "./content";
import { NfcPhone } from "./NfcPhone";
import styles from "./customer.module.css";

/**
 * 2.1 Hero — LIGHT. The signature "last receipt you'll ever lose" moment.
 *
 * Light because the fork's light bottom half leads here (2026-09-10): the
 * page must open on the same flat #F5F5F5 so the fork's commit reads as that
 * half growing into this page. The ground itself is painted by FlowGround
 * (`initial="light"`); this section only declares it. Text uses the ground's
 * --flow-* ink so it stays correct while the ground crossfades below.
 *
 * The demo phone keeps its dark bezel — a phone is a dark object — and the
 * receipt inside it keeps the App Clip palette on purpose.
 */
export function Hero() {
  return (
    <FlowSection
      ground="light"
      // A FULL SCREEN again (2026-09-23, "screens, not sections" parity with
      // /business). `styles.screen` makes it >= 100svh from 821px and centres
      // the content column vertically; `items-center` centres the 1150 column
      // horizontally in both directions of the flex box (column on desktop,
      // row below 821px, where the hero is content-height again). The padding
      // lives on `styles.hero` because the phone's height budget
      // (.demoStage in customer.module.css) reads the same --hero-pt: the top
      // clears the nav so the whole phone shows, and the bottom keeps the
      // scroll cue on its own line.
      className={`${styles.screen} ${styles.rhythm} ${styles.hero} flex items-center justify-center overflow-hidden`}
    >
      {/* The hero keeps its own pointer-tracked glow: it is part of the live
          demo moment, not decoration. Everything else (aurora, grain,
          watermark, rails) comes from the page-level kit. */}
      <Spotlight strength={70} className="pointer-events-none absolute inset-0">
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(80% 65% at 76% 34%, rgba(235,113,0,.11), transparent 58%)",
          }}
        />
      </Spotlight>

      {/* justify-START, not justify-between or justify-center. `justify-between`
          once spent the phone's ~78px of width-correction as a 318px gap
          instead of shrinking; centring the pair as a block pushed the
          headline's left edge past where every other section's headline
          starts (2026-09-10 — Nico: "text too far right"). This 1150 column
          is the same one Problem/Features/HowItWorks/Vision use, so hugging
          it to the left edge lines every left-aligned headline up. */}
      <div
        className="relative flex w-full flex-wrap items-center justify-start"
        style={{ maxWidth: 1150, gap: "clamp(28px,4.5vw,64px)", zIndex: 1 }}
      >
        <div style={{ maxWidth: 560, flex: "1 1 420px" }}>
          <ChildStagger>
            <SectionLabel index="01">{heroContent.eyebrow}</SectionLabel>
            <WordReveal
              as="h1"
              className="[font-family:var(--font-display)] font-bold text-[length:var(--fs-h1-customer)] leading-[.98] tracking-[-.025em] text-[var(--flow-fg)]"
            >
              {heroContent.headline}
            </WordReveal>
            <p
              style={{
                marginTop: "var(--gap-title)",
                fontSize: "var(--fs-lead)",
                lineHeight: 1.5,
                color: "var(--flow-fg-2)",
                maxWidth: "44ch",
                fontWeight: 400,
              }}
            >
              {heroContent.lead}
            </p>
            <div className="flex flex-wrap items-center" style={{ marginTop: "var(--gap-body)", gap: 14 }}>
              <Magnetic className={styles.ctaMagnetic}>
                {/* Navy ripple: it's the press feedback ON the orange button,
                    so it's right on either ground. The Ripple is the pill
                    itself (styles.ctaPill): it clips the splash AND carries
                    the hover glow and press scale, so the glow hugs the pill
                    exactly — see .ctaPill in customer.module.css. */}
                <Ripple variant="navy" className={`overflow-hidden rounded-full ${styles.ctaPill}`}>
                  <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.ctaButton}
                    style={{
                      border: "none",
                      cursor: "pointer",
                      padding: "15px 30px",
                      borderRadius: 999,
                      background: "var(--orange)",
                      color: "var(--navy)",
                      fontWeight: 600,
                      fontSize: 16,
                      textDecoration: "none",
                      display: "inline-flex",
                    }}
                  >
                    {heroContent.ctaLabel}
                  </a>
                </Ripple>
              </Magnetic>
              <span style={{ fontSize: 14, color: "var(--flow-fg-3)" }}>{heroContent.ctaSubtext}</span>
            </div>
          </ChildStagger>
        </div>

        <NfcPhone />
      </div>

      {/* The original cue: the word plus a hairline, at the foot of the
          screen. From 821px the hero's 100px bottom padding (styles.hero)
          keeps the demo's hint row ~28px above it, so the two never read as
          one caption line; below 821px it is hidden (see .heroCue). */}
      <div
        aria-hidden="true"
        className={`absolute flex flex-col items-center ${styles.heroCue}`}
        style={{
          bottom: 22,
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-label)",
          fontSize: 11,
          letterSpacing: ".2em",
          textTransform: "uppercase",
          color: "var(--flow-fg-3)",
          gap: 8,
          zIndex: 2,
        }}
      >
        {heroContent.scrollCue}
        <span
          className={styles.arrowBob}
          style={{
            width: 1,
            height: 26,
            background: "linear-gradient(var(--flow-fg-2), transparent)",
          }}
        />
      </div>
    </FlowSection>
  );
}
