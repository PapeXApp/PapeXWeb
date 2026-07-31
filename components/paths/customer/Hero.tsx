"use client";

import { ChildStagger, Magnetic, Ripple, Spotlight, WordReveal } from "@/components/motion";
import { heroContent } from "./content";
import { NfcPhone } from "./NfcPhone";
import styles from "./customer.module.css";

/** 2.1 Hero — dark. The signature "last receipt you'll ever lose" moment. */
export function Hero() {
  return (
    <section
      data-nav-theme="dark"
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        minHeight: "100vh",
        background: "var(--navy)",
        padding: "120px clamp(20px,5vw,56px) 80px",
      }}
    >
      <Spotlight strength={70} className="pointer-events-none absolute inset-0">
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(90% 70% at 78% 30%, rgba(235,113,0,.14), transparent 55%)",
          }}
        />
      </Spotlight>

      <div
        className="relative flex w-full flex-wrap items-center justify-between gap-16"
        style={{ maxWidth: 1200 }}
      >
        <div style={{ maxWidth: 560 }}>
          <ChildStagger>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: ".26em",
                textTransform: "uppercase",
                color: "var(--orange)",
                marginBottom: 22,
              }}
            >
              {heroContent.eyebrow}
            </div>
            <WordReveal
              as="h1"
              className="[font-family:var(--font-display)] font-bold text-[clamp(40px,6vw,84px)] leading-[.98] tracking-[-.025em] text-[var(--offwhite)]"
            >
              {heroContent.headline}
            </WordReveal>
            <p
              style={{
                marginTop: 26,
                fontSize: "clamp(17px,1.5vw,20px)",
                lineHeight: 1.5,
                color: "var(--muted-on-dark)",
                maxWidth: "44ch",
                fontWeight: 400,
              }}
            >
              {heroContent.lead}
            </p>
            <div className="flex flex-wrap items-center" style={{ marginTop: 36, gap: 14 }}>
              <Magnetic>
                <Ripple variant="navy">
                  <button
                    type="button"
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
                      boxShadow: "0 6px 22px rgba(235,113,0,.3)",
                    }}
                  >
                    {heroContent.ctaLabel}
                  </button>
                </Ripple>
              </Magnetic>
              <span style={{ fontSize: 14, color: "rgba(245,245,245,.5)" }}>{heroContent.ctaSubtext}</span>
            </div>
          </ChildStagger>
        </div>

        <NfcPhone />
      </div>

      <div
        aria-hidden="true"
        className="absolute flex flex-col items-center"
        style={{
          bottom: 26,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 12,
          letterSpacing: ".2em",
          textTransform: "uppercase",
          color: "rgba(245,245,245,.4)",
          gap: 8,
        }}
      >
        {heroContent.scrollCue}
        <span
          className={styles.arrowBob}
          style={{
            width: 1,
            height: 26,
            background: "linear-gradient(rgba(245,245,245,.7), transparent)",
          }}
        />
      </div>
    </section>
  );
}
