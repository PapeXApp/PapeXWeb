"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { ChildStagger, Magnetic, Ripple, Spotlight, WordReveal } from "@/components/motion";
import { APP_STORE_URL, PLAY_STORE_URL, platformFromUserAgent } from "@/lib/storeLinks";
import { FlowSection } from "../shared/FlowSection";
import { SectionLabel } from "../shared/SectionLabel";
import { FAQ_ANCHOR, HOW_IT_WORKS_ANCHOR, heroContent } from "./content";
import { NfcPhone } from "./NfcPhone";
import styles from "./customer.module.css";

/**
 * The store listing to lead with, matched to the visitor's device: Google Play
 * on Android, the App Store everywhere else (iPhone, iPad and desktop — the
 * default). Used by every "Download the app" button on this page.
 *
 * The server can't see the device, so SSR and the first client render both
 * use the App Store (no hydration mismatch) and Android swaps after mount.
 * A hint, never a gate: both listings are live (lib/storeLinks.ts).
 */
export function useStoreUrl(): string {
  const [url, setUrl] = useState(APP_STORE_URL);
  useEffect(() => {
    if (platformFromUserAgent(navigator.userAgent) === "android") setUrl(PLAY_STORE_URL);
  }, []);
  return url;
}

/** The hero cues' click: a smooth scroll to the link's own `#id` target (an
 *  instant jump under reduced motion). The href carries the hash, so without
 *  JS — or if the target isn't on the page — it is an ordinary in-page link. */
function scrollToHash(event: MouseEvent<HTMLAnchorElement>) {
  const id = event.currentTarget.hash.slice(1);
  const target = id ? document.getElementById(id) : null;
  if (!target) return;
  event.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({
    top: Math.round(target.getBoundingClientRect().top + window.scrollY),
    behavior: reduce ? "auto" : "smooth",
  });
}

/**
 * 2.1 Hero — LIGHT. "Tap your phone. Get your receipt." — the WHAT, first.
 *
 * Light because the fork's light bottom half leads here (2026-09-10): the
 * page must open on the same flat #F5F5F5 so the fork's commit reads as that
 * half growing into this page. The ground itself is painted by FlowGround
 * (`initial="light"`); this section only declares it. Text uses the ground's
 * --flow-* ink so it stays correct while the ground crossfades below.
 *
 * The visual (NfcPhone) is a locked iPhone tapping the PapeX device on a
 * loop (P3-C4) — the phone keeps its dark bezel, a phone is a dark object.
 * What the tap DOES is §02's job; the orange line under the H1 points there.
 */
export function Hero() {
  const storeUrl = useStoreUrl();
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
            {/* P3-C4 (Nico): the orange "Scroll to see what happens" line,
                right under the H1. The hero's phone only taps; §02, the next
                section, plays out what the tap does — so this is also a link
                there (same smooth scroll as the cues below). */}
            <a href={`#${HOW_IT_WORKS_ANCHOR}`} onClick={scrollToHash} className={styles.scrollCue}>
              <span>{heroContent.scrollCue}</span>
              <span aria-hidden="true" className={styles.scrollCueChevron}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3.5 6 4.5 4.5L12.5 6" />
                </svg>
              </span>
            </a>
            {/* The lead's gap is 0.7 of --gap-title since the orange line
                joined the H1 (P3-C4): the two read as one heading block, and
                the hero keeps its height at 1440x760 (a full screen there). */}
            <p
              style={{
                marginTop: "calc(var(--gap-title) * 0.7)",
                fontSize: "var(--fs-lead)",
                lineHeight: 1.5,
                color: "var(--flow-fg-2)",
                maxWidth: "44ch",
                fontWeight: 400,
              }}
            >
              {heroContent.lead}
            </p>
            {/* CTA, then its reassurance line UNDER it (Web 2.1), then the
                "How does that work?" cue. */}
            <div className="flex flex-col items-start" style={{ marginTop: "var(--gap-body)", gap: 10 }}>
              <Magnetic className={styles.ctaMagnetic}>
                {/* Navy ripple: it's the press feedback ON the orange button,
                    so it's right on either ground. The Ripple is the pill
                    itself (styles.ctaPill): it clips the splash AND carries
                    the hover glow and press scale, so the glow hugs the pill
                    exactly — see .ctaPill in customer.module.css. */}
                <Ripple variant="navy" className={`overflow-hidden rounded-full ${styles.ctaPill}`}>
                  <a
                    href={storeUrl}
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
              <span style={{ fontSize: 14, color: "var(--flow-fg-3)", paddingLeft: 4 }}>
                {heroContent.ctaSubtext}
              </span>
            </div>
            {/* Show WHAT first, then invite the "how?" (Nico, Web 2.1). One
                cue at every width — it replaced the foot-of-screen "Scroll"
                cue, which was hidden below 821px. The arrow keeps that cue's
                bob. Targets: HOW_IT_WORKS_ANCHOR / FAQ_ANCHOR in content.ts. */}
            <div
              className="flex flex-wrap items-center"
              style={{ marginTop: "clamp(22px,3vh,34px)", columnGap: 26, rowGap: 12 }}
            >
              <a href={`#${HOW_IT_WORKS_ANCHOR}`} onClick={scrollToHash} className={styles.howCue}>
                <span>{heroContent.howCue}</span>
                <span aria-hidden="true" className={styles.howCueArrow}>
                  <span className={styles.arrowBob}>↓</span>
                </span>
              </a>
              {/* Quieter second door: straight to the FAQ (Web 2.1). */}
              <a href={`#${FAQ_ANCHOR}`} onClick={scrollToHash} className={styles.faqCue}>
                {heroContent.faqCue}
              </a>
            </div>
          </ChildStagger>
        </div>

        <NfcPhone />
      </div>
    </FlowSection>
  );
}
