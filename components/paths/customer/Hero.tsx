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
      className="flex items-start justify-center overflow-hidden"
      style={{
        // Capped, not full-screen (2026-09-22). A 100vh hero centred its
        // content in whatever box the viewport gave it, so on a tall display
        // the headline floated in the middle with dead air above and below.
        // min(100vh, 760px) + items-start seats the content just under the
        // nav and lets the section end when the content does.
        minHeight: "min(100vh, 760px)",
        padding: "clamp(96px,12vh,128px) clamp(20px,5vw,56px) var(--section-pad-y)",
      }}
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
          is the same one Problem/Features/HowItWorks/Proof use, so hugging
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
                marginTop: 26,
                fontSize: "clamp(17px,1.5vw,20px)",
                lineHeight: 1.5,
                color: "var(--flow-fg-2)",
                maxWidth: "44ch",
                fontWeight: 400,
              }}
            >
              {heroContent.lead}
            </p>
            <div className="flex flex-wrap items-center" style={{ marginTop: 36, gap: 14 }}>
              <Magnetic className={styles.ctaMagnetic}>
                {/* Navy ripple: it's the press feedback ON the orange button,
                    so it's right on either ground. rounded-full on Ripple
                    clips both the ripple splash AND the button's own hover
                    glow to the pill shape — see .ctaMagnetic in
                    customer.module.css for why the glow moved out here. */}
                <Ripple variant="navy" className="overflow-hidden rounded-full">
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
                      boxShadow: "0 6px 22px rgba(235,113,0,.28)",
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

      {/* The original cue: the word plus a hairline. On a short viewport the
          hero used to grow past 100vh and this absolutely-positioned element
          landed below the fold — the fix is the hero's height budget (see the
          phone sizing in customer.module.css), not the cue. */}
      <div
        aria-hidden="true"
        className={`absolute flex flex-col items-center ${styles.heroCue}`}
        style={{
          bottom: 26,
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
