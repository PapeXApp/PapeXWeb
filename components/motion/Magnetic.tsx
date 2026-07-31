"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import type { CSSProperties, ReactNode } from "react"

type MagneticProps = {
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

// The spec's primary easing (expo-out), reused here per the README's
// "Easing & Duration" table ("reveals, magnetic pull, card lift").
const EASE = "cubic-bezier(.16,1,.3,1)"

/**
 * Magnetic-pull wrapper for primary CTAs. Tracks `pointermove` window-wide;
 * within `width*0.9 + 60px` of the cursor it translates by
 * `translate(dx*0.28, dy*0.4)` (raw pixel offsets from the element's center,
 * asymmetric per axis per spec); otherwise it eases back to `0,0`. 350ms
 * expo-out.
 *
 * Fine pointers only — no-ops (renders children, no transform/listener) on
 * touch devices and under `prefers-reduced-motion: reduce`.
 */
export function Magnetic({ children, className, style }: MagneticProps) {
  const prefersReduced = useReducedMotion()
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
        setOffset(distance < rect.width * 0.9 + 60 ? { x: dx * 0.28, y: dy * 0.4 } : { x: 0, y: 0 })
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
