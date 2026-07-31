"use client"

import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import type { CSSProperties, ReactNode } from "react"

type ParallaxProps = {
  /** Parallax strength. Spec value: 0.06 on the proof glow. Default: 0.06. */
  factor?: number
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * Scroll-driven parallax, rAF-throttled: translates by
 * `translate3d(0, -(elementCenter - viewportCenter) * factor, 0)`, recomputed
 * from a single cached `getBoundingClientRect()` read per frame.
 *
 * Renders with no transform (static) under `prefers-reduced-motion: reduce`.
 */
export function Parallax({ factor = 0.06, children, className, style }: ParallaxProps) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (prefersReduced) return
    let raf: number | null = null
    const update = () => {
      raf = null
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const elementCenter = rect.top + rect.height / 2
      const viewportCenter = window.innerHeight / 2
      setOffset(-(elementCenter - viewportCenter) * factor)
    }
    const onScroll = () => {
      if (raf === null) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [prefersReduced, factor])

  const computedStyle: CSSProperties = prefersReduced
    ? { ...style }
    : { ...style, transform: `translate3d(0,${offset.toFixed(1)}px,0)`, willChange: "transform" }

  return (
    <div ref={ref} className={className} style={computedStyle}>
      {children}
    </div>
  )
}

export default Parallax
