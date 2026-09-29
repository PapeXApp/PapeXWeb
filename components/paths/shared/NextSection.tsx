"use client"

import type { MouseEvent } from "react"
import "@/components/motion/motion.css"
import styles from "./next-section.module.css"

/**
 * The next-section arrow (Web 2.1 P3-R1). Nico: "somewhere at the bottom of
 * each section an arrow for the next section, but ONLY if it's a full section
 * view, and not if it's animations that reveal the info" — so it goes on the
 * full-screen STATIC sections only, never on a pinned scroll scene (those
 * reveal their content by scrolling), and never on the last section before
 * the footer.
 *
 * Render it as the LAST child of a FlowSection (which is position: relative).
 * CSS shows it from 821px only (next-section.module.css). It rises in last,
 * on the same scroll-linked reveal as the section's content (motion.css
 * `.papex-rv-arrow`: over its own entry, so it is fully shown once fully on
 * screen); reduced motion and older browsers show it still.
 *
 * The href is the target's `#id`, so with JS off it is an ordinary in-page
 * link. With JS it scrolls smoothly (instantly under reduced motion) to the
 * target's top, pushed down only if the target's section label would land
 * under the fixed nav.
 *
 * SPACING (Web 2.1 P4, Nico: "this is too close"). The arrow used to sit
 * centred in the section's 60px bottom padding, ~10px under the last card.
 * Now it renders an in-flow BAND before the arrow (next-section.module.css
 * `.band`), so an arrowed section reserves room for it: content, then
 * --next-gap, the 40px ring, --next-gap, the section's edge. Because the band
 * is in flow, a centred full screen with free space just recentres, and one
 * that is already full grows by the band instead of letting content run into
 * the arrow. No call site sizes anything.
 *
 * `band="inset"` keeps the old placement (no band, arrow centred in the
 * section's own bottom padding). Only for a section that already keeps its
 * content clear of the arrow some other way, where the band would only make
 * the screen taller than the viewport:
 *   - the /customers hero: its phone height is solved from 100svh
 *     (customer.module.css `--phone-h`) and its 100px bottom padding holds
 *     the arrow; the device's solid edge stays 44-67px above the ring.
 *   - /customers Personas: its question/result panel has a min-height, so
 *     the painted content ends 59px+ above the ring in either state.
 */
export function NextSection({
  targetId,
  name,
  band = "reserve",
}: {
  targetId: string
  name: string
  band?: "reserve" | "inset"
}) {
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById(targetId)
    if (!target) return
    event.preventDefault()
    const navBottom = document.querySelector(".rd-nav")?.getBoundingClientRect().bottom ?? 0
    const sectionTop = target.getBoundingClientRect().top
    // The first section label that is actually laid out (pinned scenes carry
    // a second, display:none copy of their header).
    const label = Array.from(target.querySelectorAll<HTMLElement>("[data-section-label]")).find(
      (el) => el.getClientRects().length > 0,
    )
    // Measure the label where it will REST: a scroll reveal may still be
    // holding it (or a wrapper) lower with a translateY, which would make the
    // label look further down than it lands (verifier, quiz -> features).
    let pending = 0
    for (let el: HTMLElement | null = label ?? null; el && el !== target; el = el.parentElement) {
      const tf = getComputedStyle(el).transform
      if (tf && tf !== "none") pending += new DOMMatrixReadOnly(tf).m42
    }
    const labelOffset = label ? label.getBoundingClientRect().top - pending - sectionTop : Infinity
    const clearance = Math.max(0, navBottom + 12 - labelOffset)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({
      top: Math.round(sectionTop + window.scrollY - clearance),
      behavior: reduce ? "auto" : "smooth",
    })
    // Keyboard activation (no pointer): move focus along with the view.
    if (event.detail === 0) {
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1")
      target.focus({ preventScroll: true })
    }
  }

  return (
    <>
      {band === "reserve" ? <div aria-hidden="true" className={styles.band} /> : null}
      <div className={band === "reserve" ? `${styles.next} ${styles.nextBand}` : styles.next}>
        <a
          href={`#${targetId}`}
          onClick={onClick}
          aria-label={`Next section: ${name}`}
          className={`papex-rv papex-rv-arrow ${styles.link}`}
          data-reveal=""
          data-next-section={targetId}
        >
          <span aria-hidden="true" className={styles.ring}>
            <svg viewBox="0 0 20 20" className={styles.icon} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3.5v12.5" />
              <path d="M4.5 10.5 10 16l5.5-5.5" />
            </svg>
          </span>
        </a>
      </div>
    </>
  )
}

export default NextSection
