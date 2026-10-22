"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./nfcTag.module.css";

/**
 * The PapeX sticker (Web 2.2, 2026-10-21; was the acrylic "tap tag" stand of
 * Web 2.1 P4), drawn like /business (Nico: "same as the for businesses
 * visual style"): the whole counter scene of section 04,
 * public/product/rds-counter.webp — the counter block, the card terminal
 * and the sticker ("TAP HERE", the rings, the "$" badge, "Collect and
 * Save.") lying flat in the true-isometric camera. The phone HowItWorks
 * seats under it comes up onto the sticker's tap target, as in the hero's
 * tap: its top edge meets the rings, and the bow lifts it onto them.
 *
 * Geometry (keep in step with nfcTag.module.css). The caller's box is W
 * wide (the old stand's width) and stood back so the phone column's centre
 * is 0.9 W in from its left edge (customer.module.css .walkTag). The art is
 * drawn at its own width, max(2.6 W, 440px), so the sticker is never under
 * ~180px (the tag measures 92-210px across layouts), with its tap target on
 * that centre, ~33-41px above the phone's top edge (seated at TAG_READ_LINE x
 * W), so the rings show whole until the bow lifts the phone onto them. Above the phone:
 * "TAP HERE", the rings and the terminal; the phone covers the counter's
 * front. The art is cut to the viewport on phones (and at the box's top
 * there, 0.45 W above it on desktop), so it never widens the page or climbs
 * into the text above.
 *
 * `pulsing` is the moment the phone lands on it: each rising edge plays a
 * flash on the tap target and two rings spreading on the sticker's plane
 * ONCE, to the end, even though the caller's flag drops after ~380ms.
 * Reduced motion: no rings, no flash. `line` / `sub` are the caller's words
 * for what the sticker says; the art prints its own "TAP HERE", so they are
 * not drawn again, and `label` (the accessible name) carries the words.
 */
export const TAG_RATIO = 1009 / 1400;
export const TAG_READ_LINE = 0.8;

export function NfcTag({
  pulsing = false,
  label,
}: {
  pulsing?: boolean;
  /** The accessible name of the whole picture. */
  label: string;
  /** The printed call to action ("TAP HERE"); the art prints it itself. */
  line?: string;
  /** The small print under it; the art has none, so it is not drawn. */
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
      <span className={styles.win} aria-hidden="true">
        <span className={styles.scene}>
          <Image
            src="/product/rds-counter.webp"
            alt=""
            width={1400}
            height={1009}
            sizes="(max-width: 820px) 440px, 520px"
            className={styles.art}
            draggable={false}
          />
          {/* The tap target (the sticker's rings), where the flash and rings start. */}
          <span className={styles.target}>
            {burst > 0 ? (
              <span key={burst} className={styles.rings}>
                <span className={styles.flash} />
                <span className={styles.ring} />
                <span className={`${styles.ring} ${styles.ring2}`} />
              </span>
            ) : null}
          </span>
        </span>
      </span>
    </div>
  );
}
