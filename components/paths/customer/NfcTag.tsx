"use client";

import { useEffect, useRef, useState } from "react";
import { FullLogo } from "@/components/brand/full-logo";
import styles from "./nfcTag.module.css";

/**
 * The PapeX tap tag (Web 2.1 P4, 2026-09-28): the small counter stand a
 * shopper taps at the register, drawn the way the familiar "review us" NFC
 * tap stands are — a clear acrylic plaque on a little acrylic foot, printed
 * with the brand lockup, a phone-with-contactless-waves glyph, and one line
 * telling you what the tap does. Brand palette only (navy face, orange
 * waves, white type); the lockup is the real FullLogo, recoloured for navy.
 *
 * Replaces the RDH box in §06 "How it works" (Nico: most visitors can't tap
 * yet, and the tag is what they will actually see at the counter). The box
 * (RdhDevice.tsx) still exists for the hero and /business.
 *
 * Built in HTML/CSS + one inline SVG, sized off its own width with container
 * query units (cqw), so the caller sets only the width and every part scales
 * with it. `pulsing` is the moment the phone lands on it: each rising edge
 * plays the waves' flash and two expanding rings ONCE, to the end, even
 * though the caller's flag drops after ~380ms. Reduced motion: no rings,
 * no flash — the still plaque.
 *
 * Geometry callers depend on (keep in step with the CSS): the plaque is
 * TAG_RATIO tall per unit of width, and everything a shopper needs to read
 * sits above TAG_READ_LINE (as a fraction of the width), so a phone seated
 * there covers only the foot.
 */
export const TAG_RATIO = 1.06;
export const TAG_READ_LINE = 0.8;

export function NfcTag({
  pulsing = false,
  label,
  line,
  sub,
}: {
  pulsing?: boolean;
  /** The accessible name of the whole picture. */
  label: string;
  /** The printed call to action ("Tap for your receipt"). */
  line: string;
  /** The small print under it; omitted when empty. */
  sub?: string;
}) {
  /** Bumped on each pulse's rising edge; keys the rings so each plays in full. */
  const [burst, setBurst] = useState(0);
  const was = useRef(pulsing);
  useEffect(() => {
    if (pulsing && !was.current) setBurst((n) => n + 1);
    was.current = pulsing;
  }, [pulsing]);

  return (
    <div className={styles.tag} role="img" aria-label={label}>
      <div className={styles.edge} />
      <div className={styles.plaque}>
        <div className={styles.face}>
          <FullLogo letters="#FFFFFF" body="#EB7100" lines="#FFFFFF" className={styles.logo} />
          <div className={styles.iconWrap}>
            {burst > 0 ? (
              <span key={burst} className={styles.rings}>
                <span className={styles.ring} />
                <span className={`${styles.ring} ${styles.ring2}`} />
              </span>
            ) : null}
            <svg
              viewBox="0 0 64 64"
              className={styles.icon}
              data-flash={burst > 0 ? burst % 2 : undefined}
              aria-hidden="true"
            >
              {/* The phone, leaning in to tap. */}
              <g transform="rotate(-12 24 33)" fill="none" stroke="#FFFFFF" strokeLinecap="round">
                <rect x="11" y="11" width="25" height="43" rx="5.5" strokeWidth="3" />
                <line x1="20" y1="17" x2="27" y2="17" strokeWidth="2.4" />
              </g>
              {/* Contactless waves. */}
              <g fill="none" stroke="#EB7100" strokeWidth="3.4" strokeLinecap="round" className={styles.waves}>
                <path d="M42 22.5 a8 8 0 0 1 0 13" />
                <path d="M47.5 17 a15 15 0 0 1 0 24" />
                <path d="M53 11.5 a21.5 21.5 0 0 1 0 35" />
              </g>
            </svg>
          </div>
          <p className={styles.line}>{line}</p>
          {sub ? <p className={styles.sub}>{sub}</p> : null}
        </div>
        <span className={styles.glint} />
      </div>
      <div className={styles.base} />
    </div>
  );
}
