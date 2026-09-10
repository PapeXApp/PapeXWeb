"use client"

import { useEffect, useRef, useState } from "react"
import { useSafeReducedMotion } from "./useSafeReducedMotion"
import type { CSSProperties, ReactNode } from "react"

type MagneticProps = {
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

// The spec's primary easing (expo-out), reused here per the README's
// "Easing & Duration" table ("reveals, magnetic pull, card lift").
const EASE = "cubic-bezier(.16,1,.3,1)"

// Pull factors and — the important part — HARD CAPS on the result.
//
// The original spec was `translate(dx*0.28, dy*0.4)` with no ceiling, inside a
// catch radius of `width*0.9 + 60`. On a ~170px CTA that radius is ~213px, so
// at its edge the button could travel 60px across and 85px down — further than
// its own height. It read as the button fleeing the cursor rather than leaning
// toward it. The caps below are what keep the pull tight; the factors only
// decide how quickly it reaches them.
const PULL_X = 0.18
const PULL_Y = 0.24
const MAX_X = 12 // px
const MAX_Y = 9 // px — less than X: vertical drift is far more noticeable

const clamp = (value: number, limit: number) =>
  value > limit ? limit : value < -limit ? -limit : value

/**
 * Magnetic-pull wrapper for primary CTAs. Tracks `pointermove` window-wide;
 * within `width*0.9 + 60px` of the cursor it leans toward the pointer by
 * `dx*PULL_X` / `dy*PULL_Y`, capped at MAX_X / MAX_Y px so the element never
 * travels further than a nudge; otherwise it eases back to `0,0`. 350ms
 * expo-out.
 *
 * Fine pointers only — no-ops (renders children, no transform/listener) on
 * touch devices and under `prefers-reduced-motion: reduce`.
 */
export function Magnetic({ children, className, style }: MagneticProps) {
  const prefersReduced = useSafeReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const [fine, setFine] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    setFine(window.matchMedia("(pointer:fine)").matches)
  }, [])

  const active = fine && !prefersReduced

  useEffect(() => {
    if (!active) return
    let raf: number | null = null
    const onMove = (event: PointerEvent) => {
      if (raf !== null) return
      raf = requestAnimationFrame(() => {
        raf = null
        const el = ref.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        if (!rect.width) return
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = event.clientX - cx
        const dy = event.clientY - cy
        const distance = Math.hypot(dx, dy)
        const inRange = distance < rect.width * 0.9 + 60
        setOffset(
          inRange
            ? {
                x: clamp(dx * PULL_X, MAX_X),
                y: clamp(dy * PULL_Y, MAX_Y),
              }
            : { x: 0, y: 0 },
        )
      })
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [active])

  const isOffset = offset.x !== 0 || offset.y !== 0
  const computedStyle: CSSProperties = {
    display: "inline-block",
    ...style,
    transform: active ? `translate(${offset.x.toFixed(1)}px,${offset.y.toFixed(1)}px)` : undefined,
    transition: active ? `transform .35s ${EASE}` : undefined,
    willChange: active && isOffset ? "transform" : undefined,
  }

  return (
    <span ref={ref} className={className} style={computedStyle}>
      {children}
    </span>
  )
}

export default Magnetic
