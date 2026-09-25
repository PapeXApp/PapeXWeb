"use client"

import { useEffect, useRef } from "react"
import { Marquee } from "@/components/motion"
import { cn } from "@/lib/utils"
import styles from "./flow.module.css"

/**
 * The phrase ribbon both path homes run between their sections. It replaced
 * a full-bleed orange band — a hard colour block was exactly the kind of cut
 * the flow ground exists to remove. Now it is a slim mono line on whatever
 * ground is running, framed by its own top/bottom hairlines, with orange only
 * in the separators.
 *
 * It scrolls CONTINUOUSLY (infinite loop, set in flow.module.css over
 * Marquee's finite default). The loop is paused while the ribbon is off
 * screen — `data-off`, written straight on the element from an
 * IntersectionObserver, so nothing re-renders — and it is a still run under
 * prefers-reduced-motion (Marquee).
 *
 * Deliberately NOT a FlowSection: it declares no ground, so crossing the
 * middle of the viewport it simply keeps the current one.
 */
export function Ribbon({
  phrases,
  duration,
  className,
}: {
  phrases: readonly string[]
  duration: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) el.removeAttribute("data-off")
          else el.setAttribute("data-off", "")
        }
      },
      // a little early, so it is already moving when it scrolls in
      { rootMargin: "200px 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={cn(styles.ribbon, className)}>
      <div className={styles.ribbonBand}>
        <Marquee duration={duration} className={styles.ribbonTrack}>
          <span className={styles.ribbonRun}>
            {phrases.map((phrase) => (
              <span key={phrase} className={styles.ribbonItem}>
                <span>{phrase}</span>
                <i aria-hidden="true" className={styles.ribbonSep} />
              </span>
            ))}
          </span>
        </Marquee>
      </div>
    </div>
  )
}
