"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { useSafeReducedMotion } from "./useSafeReducedMotion"
import "./motion.css"

type MarqueeProps = {
  /** A single "run" of content (e.g. a row of phrases). Duplicated internally,
   * with the duplicate marked `aria-hidden`, so the loop reads seamlessly. */
  children: ReactNode
  /** Loop duration, in seconds. Spec range: 30-32s. Default: 30. */
  duration?: number
  /** Alias for `duration`. `duration` wins if both are given. */
  durationSeconds?: number
  /** How many loops to run once it scrolls into view, then rest (no infinite
   * animations on the site). Default: 2. */
  iterations?: number
  className?: string
  style?: CSSProperties
}

/**
 * Horizontal marquee, 30-32s linear, seamless. A single track holds two
 * copies of `children` side by side and animates `translateX(0 → -50%)`;
 * when it resets to 0 the second (aria-hidden) copy is already in the exact
 * position the first one started in.
 *
 * FINITE: the site has no infinite animations. The track waits (paused at 0)
 * until the band first scrolls into view, runs `iterations` loops, then rests
 * on its last frame (-50%), which is pixel-identical to the first, so it
 * simply stops as a full, still line of phrases.
 *
 * Stops (renders a single static, non-duplicated run) under
 * `prefers-reduced-motion: reduce`.
 */
export function Marquee({ children, duration, durationSeconds, iterations = 2, className, style }: MarqueeProps) {
  const prefersReduced = useSafeReducedMotion()
  const resolvedDuration = duration ?? durationSeconds ?? 30
  const boxRef = useRef<HTMLDivElement>(null)
  const [run, setRun] = useState(false)

  useEffect(() => {
    if (run || prefersReduced) return
    const el = boxRef.current
    if (!el || typeof IntersectionObserver === "undefined") {
      setRun(true)
      return
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setRun(true)
        io.disconnect()
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [run, prefersReduced])

  if (prefersReduced) {
    return (
      <div className={className} style={{ overflow: "hidden", ...style }}>
        <div style={{ display: "inline-flex", whiteSpace: "nowrap" }}>{children}</div>
      </div>
    )
  }

  return (
    <div ref={boxRef} className={className} style={{ overflow: "hidden", ...style }}>
      <div
        className="papex-marquee-track"
        style={{
          display: "inline-flex",
          whiteSpace: "nowrap",
          animationDuration: `${resolvedDuration}s`,
          animationIterationCount: iterations,
          animationPlayState: run ? "running" : "paused",
        }}
      >
        <span style={{ display: "inline-flex" }}>{children}</span>
        <span aria-hidden="true" style={{ display: "inline-flex" }}>
          {children}
        </span>
      </div>
    </div>
  )
}

export default Marquee
