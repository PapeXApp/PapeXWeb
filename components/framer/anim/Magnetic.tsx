"use client"

import { m, useReducedMotion, useSpring } from "motion/react"
import { useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react"

type MagneticProps = {
  children: ReactNode
  /**
   * Fraction of the cursor's offset from the element center that the element
   * travels toward the cursor. Default: 0.35.
   */
  strength?: number
  /** Extra scale applied while hovered. Default: 1.04. */
  hoverScale?: number
  /** Scale applied while pressed. Default: 0.97. */
  tapScale?: number
  className?: string
}

/**
 * Magnetic-pull wrapper for primary CTAs: the element eases toward the pointer
 * while hovered, then springs back to rest on leave. Adds a hover/tap scale for
 * extra tactility.
 *
 * Desktop / fine-pointer only (touch devices and reduced-motion render a plain
 * element with no listeners). matchMedia is read in an effect, so SSR markup is
 * stable and there is no hydration mismatch.
 */
export function Magnetic({
  children,
  strength = 0.35,
  hoverScale = 1.04,
  tapScale = 0.97,
  className,
}: MagneticProps) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)

  const spring = { stiffness: 260, damping: 18, mass: 0.5 }
  const x = useSpring(0, spring)
  const y = useSpring(0, spring)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    setEnabled(window.matchMedia("(hover: hover) and (pointer: fine)").matches)
  }, [])

  const active = enabled && !prefersReduced

  function handleMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!active || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const relX = event.clientX - (rect.left + rect.width / 2)
    const relY = event.clientY - (rect.top + rect.height / 2)
    x.set(relX * strength)
    y.set(relY * strength)
  }

  function handleLeave() {
    x.set(0)
    y.set(0)
  }

  if (!active) {
    // Render a plain inline-block wrapper so layout matches the active branch.
    return <span className={className}>{children}</span>
  }

  return (
    <m.span
      ref={ref}
      className={className}
      style={{ x, y, display: "inline-flex" }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      whileHover={{ scale: hoverScale }}
      whileTap={{ scale: tapScale }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
    >
      {children}
    </m.span>
  )
}

export default Magnetic
