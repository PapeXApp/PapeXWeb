"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { PlaneMark } from "@/components/brand/plane-mark"
import type { Ground } from "./FlowSection"
import { publishFlowGround } from "./flowSignal"
import styles from "./flow.module.css"

/** A ~2%-tall band through the middle of the viewport. Whichever section is
 *  crossing it owns the ground. */
const MIDDLE_BAND = "-49% 0px -49% 0px"

/**
 * The page-level ground for a path home, plus the one depth kit every section
 * shares. See flow.module.css for the full rationale.
 *
 * Switching is an IntersectionObserver on the sections' `data-ground` — no
 * scroll listener, no rAF loop (fork.tsx owns the site's only one). The
 * observer writes the attribute straight onto the DOM node, so a ground swap
 * never re-renders React; CSS does the crossfade.
 *
 * `initial` is rendered on the server so first paint is already the hero's
 * colour — the fork's commit animation depends on that continuity.
 *
 * The site footer now lives INSIDE this component as the final navy
 * FlowSection (see each path's index.tsx), so it is observed like any other
 * section and the last light section crossfades into it. The
 * `document.querySelector('.rd-footer')` fallback below is kept only for the
 * legacy mount shape; when the footer is in-flow it is already in `sections`
 * and `observe()` on the same node is a no-op.
 */
export function FlowGround({ initial, children }: { initial: Ground; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root || typeof IntersectionObserver === "undefined") return

    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-ground]"))
    const footer = root.querySelector<HTMLElement>(".rd-footer")
      ? null
      : document.querySelector<HTMLElement>(".rd-footer")
    const groundOf = (el: Element): Ground =>
      el === footer ? "navy" : ((el as HTMLElement).dataset.ground as Ground)

    publishFlowGround(root.dataset.ground as Ground)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const next = groundOf(entry.target)
          if (next && root.dataset.ground !== next) {
            root.dataset.ground = next
            publishFlowGround(next)
          }
        }
      },
      { rootMargin: MIDDLE_BAND, threshold: 0 },
    )
    sections.forEach((el) => observer.observe(el))
    if (footer) observer.observe(footer)
    return () => {
      observer.disconnect()
      publishFlowGround(null)
    }
  }, [])

  return (
    <div ref={ref} className={styles.flow} data-ground={initial}>
      <div aria-hidden="true" className={styles.kit}>
        <div className={styles.viewport}>
          <div className={`${styles.aurora} ${styles.auroraLight}`}>
            <div className={`${styles.pool} ${styles.poolA}`} />
            <div className={`${styles.pool} ${styles.poolB}`} />
            <div className={`${styles.pool} ${styles.poolC}`} />
          </div>
          <div className={`${styles.aurora} ${styles.auroraNavy}`}>
            <div className={`${styles.pool} ${styles.poolA}`} />
            <div className={`${styles.pool} ${styles.poolB}`} />
            <div className={`${styles.pool} ${styles.poolC}`} />
          </div>
          <div className={styles.mark}>
            {/* Body follows the ground's ink; the circuit lines take the
                ground colour, so they read as etched out of the plane. */}
            <PlaneMark body="currentColor" lines="var(--flow-ground)" size={760} />
          </div>
          <div className={styles.grain} />
        </div>
        {/* TEMPORARY (Nico, 2026-09-10): guide rails stay for now — remove later. */}
        <div className={styles.rails}>
          <i className={`${styles.rail} ${styles.railL}`} />
          <i className={`${styles.rail} ${styles.railR}`} />
        </div>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  )
}
