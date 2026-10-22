"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { useSafeReducedMotion } from "./useSafeReducedMotion"
import "./motion.css"

type MarqueeProps = {
  /** A single "run" of content (e.g. a row of phrases). Repeated internally,
   * with every repeat marked `aria-hidden`, so the loop reads seamlessly. */
  children: ReactNode
  /** What to show instead under `prefers-reduced-motion: reduce`. Default:
   * one copy of `children`. The Ribbon passes a wrapping line that shows
   * only the phrases that fit whole. */
  staticContent?: ReactNode
  /** Seconds for the track to travel one run's width. Default: 30. */
  duration?: number
  /** Alias for `duration`. `duration` wins if both are given. */
  durationSeconds?: number
  /** How many loops to run, then rest on the last frame (pixel-identical to
   * the first). `Infinity` loops for as long as it is on screen. Default: 2. */
  iterations?: number
  className?: string
  style?: CSSProperties
}

/** Start/stop a little before the band reaches the screen, so it is already
 *  moving when it scrolls in. */
const NEAR_SCREEN = "200px 0px"

/**
 * Horizontal marquee: a track of N copies of `children` side by side, moved
 * left by exactly ONE copy's width per loop, so when a loop restarts the next
 * copy is already where the first one began.
 *
 * WHY THIS IS JS (Web 2.1 P8, Noah on an iPhone: "the ribbons are not moving,
 * locked in place, just text overlapped"). It used to be a CSS keyframe to
 * `translateX(-50%)`. On iOS Safari an accelerated transform animation turns
 * the percentage into pixels ONCE, when the animation is handed to the
 * compositor, and keeps those pixels after the box changes size. The band
 * started moving before the web font swapped in, so the loop distance no
 * longer matched a copy: the copies drifted over each other and every loop
 * snapped back. Now the distance is measured in pixels AFTER
 * `document.fonts.ready`, re-measured whenever a copy changes width
 * (ResizeObserver, keeping the loop's progress), and handed to the Web
 * Animations API as explicit pixels. A copy narrower than the band gets
 * repeated until the band is always full.
 *
 * Runs only while the band is on or near the screen (IntersectionObserver
 * play/pause, nothing re-renders). Before hydration and with JS off it is a
 * still, clipped line. Under `prefers-reduced-motion: reduce` it renders
 * `staticContent` (or one copy) and never animates. Transform only.
 */
export function Marquee({
  children,
  staticContent,
  duration,
  durationSeconds,
  iterations = 2,
  className,
  style,
}: MarqueeProps) {
  const prefersReduced = useSafeReducedMotion()
  const seconds = duration ?? durationSeconds ?? 30
  const boxRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const runRef = useRef<HTMLSpanElement>(null)
  const [copies, setCopies] = useState(2)

  useEffect(() => {
    if (prefersReduced) return
    const box = boxRef.current
    const track = trackRef.current
    const run = runRef.current
    if (!box || !track || !run || typeof track.animate !== "function") return

    const loopMs = seconds * 1000
    let anim: Animation | null = null
    let distance = 0
    let near = typeof IntersectionObserver === "undefined"
    let disposed = false

    const build = () => {
      if (disposed) return
      const width = run.getBoundingClientRect().width
      if (width < 1) return
      // Enough copies that the band never shows an empty tail mid-loop.
      const need = Math.max(2, Math.ceil(box.clientWidth / width) + 1)
      setCopies((current) => (current === need ? current : need))
      if (anim && Math.abs(width - distance) < 0.5) return
      // Keep where the loop was, so a re-measure is invisible.
      const elapsed = anim ? Number(anim.currentTime ?? 0) : 0
      anim?.cancel()
      distance = width
      anim = track.animate(
        [{ transform: "translate3d(0, 0, 0)" }, { transform: `translate3d(${-width}px, 0, 0)` }],
        { duration: loopMs, iterations, easing: "linear", fill: "forwards" },
      )
      anim.currentTime = elapsed
      if (!near) anim.pause()
    }

    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              const entry = entries[entries.length - 1]
              if (!entry) return
              near = entry.isIntersecting
              if (!anim) return
              if (near && anim.playState === "paused") anim.play()
              else if (!near && anim.playState === "running") anim.pause()
            },
            { rootMargin: NEAR_SCREEN },
          )
    io?.observe(box)

    // Measure only once the web fonts are in: the fallback face is a
    // different width, and that mismatch is what made the copies overlap.
    const fonts = typeof document !== "undefined" ? document.fonts : undefined
    if (fonts?.ready) fonts.ready.then(build, build)
    else build()

    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => build())
    ro?.observe(run)
    ro?.observe(box)

    return () => {
      disposed = true
      io?.disconnect()
      ro?.disconnect()
      anim?.cancel()
    }
  }, [prefersReduced, seconds, iterations])

  if (prefersReduced) {
    return (
      <div className={className} style={{ overflow: "hidden", ...style }} data-marquee-static="">
        {staticContent ?? <div style={{ display: "inline-flex", whiteSpace: "nowrap" }}>{children}</div>}
      </div>
    )
  }

  return (
    <div ref={boxRef} className={className} style={{ overflow: "hidden", ...style }}>
      <div ref={trackRef} className="papex-marquee-track" style={{ display: "inline-flex", whiteSpace: "nowrap" }}>
        <span ref={runRef} style={{ display: "inline-flex", flex: "none" }}>
          {children}
        </span>
        {Array.from({ length: copies - 1 }, (_, i) => (
          <span key={i} aria-hidden="true" style={{ display: "inline-flex", flex: "none" }}>
            {children}
          </span>
        ))}
      </div>
    </div>
  )
}

export default Marquee
