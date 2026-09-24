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
 * Landmarks (2026-09-24, docs/design/footer-landmark.md): FlowGround owns the
 * page's `<main>`. SiteShell does NOT render one around a FlowGround page, so
 * the footer can sit inside this component (and so inside the colour
 * crossfade) while staying OUTSIDE `<main>`:
 *
 *   .flow > .content > main   (the sections)
 *                    > div[data-ground="navy"] > footer.rd-footer
 *
 * Pass the footer through the `footer` prop. It is wrapped in a plain `div`,
 * not a FlowSection: a `<footer>` inside `<section>` (or `<main>`) is not a
 * contentinfo landmark, so the wrapper must not be sectioning content. The
 * wrapper still carries `data-ground="navy"`, so the observer below treats
 * it like any other section and the last light section crossfades into it.
 *
 * Backward compatible: a page that still passes the footer as the last child
 * (inside a navy FlowSection) keeps working exactly as before; its footer is
 * just still inside `<main>` until the page moves it to the slot. The
 * `document.querySelector('.rd-footer')` fallback below is kept for a footer
 * mounted outside the flow; when the footer is inside, it is already covered
 * by `sections` and the fallback stays null.
 */
export function FlowGround({
  initial,
  footer,
  children,
}: {
  initial: Ground
  /** The site footer (`<SiteFooter inFlow />`). Rendered after `<main>`, so it
   *  is the page's contentinfo landmark but still rides the ground crossfade. */
  footer?: ReactNode
  children: ReactNode
}) {
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
      </div>
      <div className={styles.content}>
        <main>{children}</main>
        {footer && (
          <div data-ground="navy" data-nav-theme="dark" className={styles.section}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
