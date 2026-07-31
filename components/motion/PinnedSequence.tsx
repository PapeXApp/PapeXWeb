"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import type { CSSProperties, ReactNode } from "react"

export type PinnedSequenceState = {
  /** Index of the currently active step (0-based, clamped to `steps - 1`). */
  activeIndex: number
  /** Overall scroll progress through the pinned runway, clamped 0..0.999. */
  progress: number
  /** Progress within the active step, 0..1 — drives per-step rail-fill etc. */
  localProgress: number
}

type PinnedSequenceProps = {
  /** Number of steps in the sequence. */
  steps: number
  /**
   * Render prop for the desktop pinned/scrubbed stage (>=821px). Called on
   * every scroll frame (rAF-throttled) with the current scrub state; the
   * consumer renders arbitrary step content (list + any per-step visuals)
   * and drives its own opacity/transform/rail styling from `activeIndex` /
   * `localProgress` per the motion spec.
   */
  children: (state: PinnedSequenceState) => ReactNode
  /**
   * Render prop for a single step in the <820px stacked fallback (no
   * pinning, no scroll-scrubbing — standard reveals only). Called once per
   * step index, 0..steps-1. Optional: if the consumer renders its own mobile
   * layout elsewhere (e.g. gated by a separate breakpoint wrapper) and just
   * needs this component to decline pinning, omit it — the unpinned branch
   * then renders nothing.
   */
  renderMobileStep?: (index: number) => ReactNode
  /** Extra scroll runway while pinned, in viewport-heights. Default: 2 (→ section height 300vh, matching the spec's "two viewport-heights of scroll"). */
  runwayViewports?: number
  className?: string
  style?: CSSProperties
  stageClassName?: string
  mobileClassName?: string
}

const BREAKPOINT = "(max-width:820px)"

/**
 * The scroll-pinned "how it works" sequence engine. Desktop (>=821px): a
 * `height: (runwayViewports + 1) * 100vh` section with an inner
 * `position:sticky; top:0; height:100vh` stage; scroll progress through the
 * runway drives `activeIndex` / `localProgress`, computed exactly as
 * `p = clamp(-rect.top / (sectionHeight - viewportHeight), 0, 0.999)`,
 * `active = floor(p * steps)`, `localProgress = p * steps - active`.
 *
 * Below 820px — and under `prefers-reduced-motion: reduce`, at any width —
 * it never pins: it renders a plain stacked list via `renderMobileStep`, one
 * per step, with no scroll-scrubbing.
 */
export function PinnedSequence({
  steps,
  children,
  renderMobileStep,
  runwayViewports = 2,
  className,
  style,
  stageClassName,
  mobileClassName,
}: PinnedSequenceProps) {
  const prefersReduced = useReducedMotion()
  const [mobile, setMobile] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const rafRef = useRef<number | null>(null)
  const [state, setState] = useState<PinnedSequenceState>({ activeIndex: 0, progress: 0, localProgress: 0 })

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia(BREAKPOINT)
    const apply = () => setMobile(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  // Reduced motion skips pinning/scrubbing entirely, same as the mobile
  // stacked fallback — it never gets stuck mid-scrub or fights the user's
  // native scroll.
  const pinned = !mobile && !prefersReduced

  useEffect(() => {
    if (!pinned) return
    const update = () => {
      rafRef.current = null
      const sec = sectionRef.current
      if (!sec) return
      const rect = sec.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      let p = total > 0 ? -rect.top / total : 0
      p = Math.max(0, Math.min(0.999, p))
      const active = Math.min(steps - 1, Math.floor(p * steps))
      const localProgress = p * steps - active
      setState({ activeIndex: active, progress: p, localProgress })
    }
    const onScroll = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [pinned, steps])

  if (!pinned) {
    if (!renderMobileStep) return null
    return (
      <section className={mobileClassName ?? className} style={style}>
        {Array.from({ length: steps }, (_, i) => (
          <div key={i}>{renderMobileStep(i)}</div>
        ))}
      </section>
    )
  }

  const sectionStyle: CSSProperties = {
    ...style,
    position: "relative",
    height: `${(runwayViewports + 1) * 100}vh`,
  }
  const stageStyle: CSSProperties = {
    position: "sticky",
    top: 0,
    height: "100vh",
    overflow: "hidden",
  }

  return (
    <section ref={sectionRef} className={className} style={sectionStyle}>
      <div className={stageClassName} style={stageStyle}>
        {children(state)}
      </div>
    </section>
  )
}

export default PinnedSequence
