"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import type { CSSProperties, ReactNode } from "react"

type SpotlightProps = {
  /**
   * Offset strength, in pixels: `dx`/`dy` (the cursor's offset from the
   * element's own center, normalized -0.5..0.5 by its own width/height)
   * times this. Spec range: 60-70 on hero/fork glows. Default: 70.
   */
  strength?: number
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

const EASE = "cubic-bezier(.16,1,.3,1)"

/**
 * Pointer-tracked glow offset. Tracks `pointermove` window-wide (matching the
 * prototype's whole-page tracking, not just while hovering the element) and
 * translates the element by `translate3d(dx*s, dy*s, 0)`, 400ms
 * cubic-bezier(.16,1,.3,1).
 *
 * Fine pointers only — no-ops (renders children with no transform/listener)
 * on touch devices and under `prefers-reduced-motion: reduce`.
 */
export function Spotlight({ strength = 70, children, className, style }: SpotlightProps) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [fine, setFine] = useState(false)
  const [transform, setTransform] = useState<string | undefined>(undefined)

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
        if (!rect.width || !rect.height) return
        const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width
        const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height
        setTransform(`translate3d(${(dx * strength).toFixed(1)}px,${(dy * strength).toFixed(1)}px,0)`)
      })
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [active, strength])

  const computedStyle: CSSProperties = {
    ...style,
    transform: active ? transform : undefined,
    transition: active ? `transform .4s ${EASE}` : undefined,
    willChange: active ? "transform" : undefined,
  }

  return (
    <div ref={ref} className={className} style={computedStyle}>
      {children}
    </div>
  )
}

export default Spotlight
