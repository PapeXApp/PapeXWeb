"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { ChildStagger, Magnetic, Ripple, Spotlight, WordReveal } from "@/components/motion";
import { APP_STORE_URL, PLAY_STORE_URL, platformFromUserAgent } from "@/lib/storeLinks";
import { FlowSection } from "../shared/FlowSection";
import { SectionLabel } from "../shared/SectionLabel";
import { FAQ_ANCHOR } from "./content";
import { HeroApp } from "./hero/HeroApp";
import { POCKET_ANCHOR, heroCopy } from "./hero/heroCopy";
import styles from "./customer.module.css";
import h from "./hero/hero.module.css";

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

/** Bottom edge of the fixed nav, in px from the viewport top: the shell's
 *  published `--rd-nav-h` when it sets one, else the nav's own box. */
function navBottom(): number {
  const published = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--rd-nav-h"));
  if (Number.isFinite(published) && published > 0) return published;
  return document.querySelector(".rd-nav")?.getBoundingClientRect().bottom ?? 0;
}

/** The hero cues' click: a smooth scroll to the link's own `#id` target (an
 *  instant jump under reduced motion), landing the section's heading 12px
 *  under the fixed nav instead of behind it (phone rework A2 — the same
 *  clearance Features' "Answer 3 questions" link uses). The href carries the
 *  hash, so without JS — or if the target isn't on the page — it is an
 *  ordinary in-page link. */
function scrollToHash(event: MouseEvent<HTMLAnchorElement>) {
  const id = event.currentTarget.hash.slice(1);
  const target = id ? document.getElementById(id) : null;
  if (!target) return;
  event.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sectionTop = target.getBoundingClientRect().top;
  // Phones only (desktop lands exactly where it always did): pushed down just
  // as far as the section's own top padding leaves its heading block (the
  // eyebrow + h2, the first one that is displayed — Pocket places its header
  // twice) under the nav. A few reads, once, on click.
  let clearance = 0;
  if (window.matchMedia("(max-width: 820px)").matches) {
    const heading = Array.from(target.querySelectorAll("h2")).find((el) => el.getClientRects().length > 0);
    const lead = heading?.parentElement ?? target;
    const leadOffset = lead.getBoundingClientRect().top - sectionTop;
    clearance = Math.max(0, navBottom() + 12 - leadOffset);
  }
  window.scrollTo({
    top: Math.round(sectionTop + window.scrollY - clearance),
    behavior: reduce ? "auto" : "smooth",
  });
}

/**
 * /customers 01 Hero — LIGHT. "Your receipt, not your identity." (Web 2.1 P4,
 * 2026-09-28.)
 *
 * The page now leads with the PapeX APP, not the tap hardware: most
 * visitors can't tap a PapeX device yet (select Bay Area stores only). The
 * headline is the old privacy section's, picked by Nico; its picture is now
 * the app itself (hero/HeroApp.tsx): a paper receipt is scanned and filed at
 * the top of the Receipts list, and three chips land beside it.
 *
 * Light because the fork's light bottom half leads here: the page must open
 * on the same flat #F5F5F5 (FlowGround `initial="light"` in index.tsx). Text
 * uses the ground's --flow-* ink so it survives the crossfade below.
 *
 * Words: hero/heroCopy.ts. Styles: hero/hero.module.css (the CTA pill's
 * glow/press classes are shared with Vision, so they stay in
 * customer.module.css).
 */
export function Hero() {
  const storeUrl = useStoreUrl();
  return (
    <FlowSection
      ground="light"
      // A full screen from 821px (`styles.screen`); `styles.rhythm` carries
      // the shared --gap-* tokens.
      className={`${styles.screen} ${styles.rhythm} ${h.hero} flex items-center justify-center overflow-hidden`}
    >
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

      <div className={h.row}>
        <div className={h.copy}>
          <ChildStagger>
            <SectionLabel index="01" className={h.eyebrow}>
              {heroCopy.eyebrow}
            </SectionLabel>
            <WordReveal as="h1" className={h.title}>
              {heroCopy.headline}
            </WordReveal>
            <p className={h.lead}>{heroCopy.lead}</p>
            <div className={h.ctaRow}>
              <Magnetic className={styles.ctaMagnetic}>
                {/* Navy ripple on the orange pill; .ctaPill carries the glow
                    and press scale (customer.module.css, shared with Vision). */}
                <Ripple variant="navy" className={`overflow-hidden rounded-full ${styles.ctaPill}`}>
                  {/* data-hero-cta: the nav hides its own "Download the app"
                      while this button is on screen (site-nav.tsx watches
                      [data-hero-cta] — deck s-02). */}
                  <a
                    href={storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.ctaButton} ${h.ctaButton}`}
                    data-hero-cta=""
                  >
                    {heroCopy.ctaLabel}
                  </a>
                </Ripple>
              </Magnetic>
              <span className={h.ctaSub}>{heroCopy.ctaSubtext}</span>
            </div>
            <div className={h.cues}>
              <a href={`#${POCKET_ANCHOR}`} onClick={scrollToHash} className={h.downCue}>
                <span>{heroCopy.downCue}</span>
                <span aria-hidden="true" className={h.downRing}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" />
                  </svg>
                </span>
              </a>
              <a href={`#${FAQ_ANCHOR}`} onClick={scrollToHash} className={h.faqCue}>
                {heroCopy.faqCue}
              </a>
            </div>
          </ChildStagger>
        </div>

        <HeroApp />
      </div>
    </FlowSection>
  );
}
