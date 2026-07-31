"use client"

import { useReducedMotion } from "motion/react"
import type { CSSProperties, ReactNode } from "react"
import "./motion.css"

type MarqueeProps = {
  /** A single "run" of content (e.g. a row of phrases). Duplicated internally,
   * with the duplicate marked `aria-hidden`, so the loop reads seamlessly. */
  children: ReactNode
  /** Loop duration, in seconds. Spec range: 30-32s. Default: 30. */
  duration?: number
  /** Alias for `duration`. `duration` wins if both are given. */
  durationSeconds?: number
  className?: string
  style?: CSSProperties
}

/**
 * Infinite horizontal marquee, 30-32s linear, seamless. A single track holds
 * two copies of `children` side by side and animates `translateX(0 → -50%)`;
 * when it resets to 0 the second (aria-hidden) copy is already in the exact
 * position the first one started in.
 *
 * Stops (renders a single static, non-duplicated run) under
 * `prefers-reduced-motion: reduce`.
 */
export function Marquee({ children, duration, durationSeconds, className, style }: MarqueeProps) {
  const prefersReduced = useReducedMotion()
  const resolvedDuration = duration ?? durationSeconds ?? 30

  if (prefersReduced) {
    return (
      <div className={className} style={{ overflow: "hidden", ...style }}>
        <div style={{ display: "inline-flex", whiteSpace: "nowrap" }}>{children}</div>
      </div>
    )
  }

  return (
    <div className={className} style={{ overflow: "hidden", ...style }}>
      <div
        className="papex-marquee-track"
        style={{ display: "inline-flex", whiteSpace: "nowrap", animationDuration: `${resolvedDuration}s` }}
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
