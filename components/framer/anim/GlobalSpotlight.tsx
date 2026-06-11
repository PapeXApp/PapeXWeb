"use client"

import {
  m,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react"
import { useEffect, useState } from "react"
import type { CSSProperties } from "react"

type GlobalSpotlightProps = {
  /** CSS color for the glow core. Default: soft brand orange. */
  color?: string
  /** Radius of the glow, in pixels. Default: 640. */
  radius?: number
  /** Blend mode for the overlay. Default: "screen" (warm light over content). */
  blendMode?: CSSProperties["mixBlendMode"]
}

/**
 * Site-wide brand spotlight: a soft orange glow, fixed to the viewport, that
 * smoothly trails the cursor across the ENTIRE page — over every section — as a
 * full-screen overlay. Because it is `position: fixed` it tracks the pointer in
 * viewport space, so it follows the mouse regardless of scroll position.
 *
 * `pointer-events: none` so it never intercepts clicks; the native cursor and
 * all underlying interactions are preserved. Low-opacity `screen` blend keeps
 * text legible while tinting the page warm where the cursor is.
 *
 * Desktop / fine-pointer only and disabled under reduced motion (renders
 * nothing). matchMedia is read in an effect so SSR markup is stable — no
 * hydration mismatch. Uses the LazyMotion-compatible `m` component.
 */
export function GlobalSpotlight({
  color = "rgba(255, 153, 51, 0.42)",
  radius = 680,
  blendMode = "screen",
}: GlobalSpotlightProps) {
  const prefersReduced = useReducedMotion()
  const [enabled, setEnabled] = useState(false)

  // Start off-screen so the glow doesn't flash at (0,0) before the first move.
  const spring = { stiffness: 120, damping: 24, mass: 0.6 }
  const x = useSpring(useMotionValue(-1000), spring)
  const y = useSpring(useMotionValue(-1000), spring)

  const background = useMotionTemplate`radial-gradient(${radius}px circle at ${x}px ${y}px, ${color} 0%, transparent 72%)`

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const ok =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !prefersReduced
    setEnabled(ok)
  }, [prefersReduced])

  useEffect(() => {
    if (!enabled) return
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [enabled, x, y])

  // Touch / reduced-motion: render nothing at all.
  if (!enabled) return null

  return (
    <m.div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        pointerEvents: "none",
        background,
        mixBlendMode: blendMode,
      }}
    />
  )
}

export default GlobalSpotlight
