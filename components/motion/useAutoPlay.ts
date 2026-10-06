"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSafeReducedMotion } from "./useSafeReducedMotion"

/**
 * "Auto animation" (Web 2.2, Noah's note 1): a scene that plays by itself on
 * a fixed clock, not scrubbed by scroll. Lifted out of the /customers hero so
 * other scenes (Pocket, RetainStory) can share one trigger.
 *
 * The hook owns only the *trigger*; the scene owns its own motion (CSS
 * keyframes, a rAF clock, whatever). It returns:
 *
 *   ref      attach to the stage element
 *   started  true once the scene should be playing. With `start: "mount"`
 *            that is immediately; with `start: "view"` it flips when the
 *            stage first enters the viewport (`amount` = fraction visible).
 *   run      a counter; use it as a React `key` (or a rAF restart signal)
 *            to replay from the top. It bumps when the stage has fully left
 *            the screen and comes back (`replay: true`, the hero behaviour),
 *            and whenever `replay()` is called.
 *   reduced  prefers-reduced-motion (hydrated-safe). The scene should show
 *            its end frame; `started` is still true so nothing stays hidden.
 *
 * Nothing here is scroll-linked; the observer only answers "is it on screen".
 */
export type AutoPlayOptions = {
  /** When playback begins. Default "view". */
  start?: "mount" | "view"
  /** Replay when the stage leaves the screen entirely and returns. Default true. */
  replay?: boolean
  /** Fraction of the stage that must be visible to start (0..1). Default 0.35. */
  amount?: number
}

export function useAutoPlay<T extends HTMLElement = HTMLDivElement>(opts: AutoPlayOptions = {}) {
  const { start = "view", replay: replayOnReturn = true, amount = 0.35 } = opts
  const ref = useRef<T>(null)
  const reduced = useSafeReducedMotion()
  const [started, setStarted] = useState(start === "mount")
  const [run, setRun] = useState(0)

  const replay = useCallback(() => setRun((n) => n + 1), [])

  useEffect(() => {
    const stage = ref.current
    if (typeof IntersectionObserver === "undefined") {
      setStarted(true)
      return
    }
    if (reduced) {
      // Reduced motion: show the finished frame, never replay.
      setStarted(true)
      return
    }
    if (!stage) return
    if (start === "mount" && !replayOnReturn) return

    let gone = false
    let begun = start === "mount"
    const thresholds = start === "view" ? [0, amount] : [0]
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1]
        if (!entry) return
        if (!entry.isIntersecting) {
          gone = true
          return
        }
        if (!begun) {
          if (entry.intersectionRatio < amount) return
          begun = true
          gone = false
          setStarted(true)
          return
        }
        if (gone && replayOnReturn) {
          gone = false
          setRun((n) => n + 1)
        }
      },
      { threshold: thresholds },
    )
    io.observe(stage)
    return () => io.disconnect()
  }, [reduced, start, replayOnReturn, amount])

  return { ref, started, run, reduced, replay }
}
