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
 */
export function NextSection({ targetId, name }: { targetId: string; name: string }) {
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
    const labelOffset = label ? label.getBoundingClientRect().top - sectionTop : Infinity
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
    <div className={styles.next}>
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
  )
}

export default NextSection
