"use client";

import { Magnetic, Ripple } from "@/components/motion";
import { useStoreUrl } from "./Hero";
import { heroCopy } from "./hero/heroCopy";
import styles from "./customer.module.css";
import h from "./hero/hero.module.css";

/**
 * The page-closing "Download the app" (deck c-37): the SAME pill, link and
 * sub-line as the hero's (Hero.tsx), rendered under the FAQ so a reader who
 * reaches the bottom has something to do. Device-matched store link
 * (useStoreUrl). Deliberately NOT `data-hero-cta`: only the hero's button
 * hides the nav's (deck s-02).
 */
export function DownloadCta() {
  const storeUrl = useStoreUrl();
  return (
    <div className={h.ctaRow} style={{ marginTop: 0 }}>
      <Magnetic className={styles.ctaMagnetic}>
        <Ripple variant="navy" className={`overflow-hidden rounded-full ${styles.ctaPill}`}>
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.ctaButton} ${h.ctaButton}`}
            // Inline on purpose: papex-brand.css's `.rd a { color: inherit }`
            // outranks the module class, and on the navy FAQ ground the
            // inherited ink is white. Navy on orange, like the hero's pill.
            style={{ color: "var(--navy)" }}
          >
            {heroCopy.ctaLabel}
          </a>
        </Ripple>
      </Magnetic>
      <span className={h.ctaSub}>{heroCopy.ctaSubtext}</span>
    </div>
  );
}
