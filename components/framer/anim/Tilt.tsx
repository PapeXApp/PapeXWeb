"use client"

import { m, useReducedMotion, useSpring } from "motion/react"
import { useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react"

type TiltProps = {
  children: ReactNode
  /** Max rotation around the X axis (pointer up/down), in degrees. Default: 6. */
  maxX?: number
  /** Max rotation around the Y axis (pointer left/right), in degrees. Default: 8. */
  maxY?: number
  /** Vertical hover lift in pixels (negative = up). Default: -6. */
  lift?: number
  /** Hover scale. Default: 1.02. */
  scale?: number
  className?: string
}

/**
 * 3D pointer tilt for cards: the surface leans toward the cursor like a card
 * held loosely in the hand, composed with a hover lift + tap press. The parent
 * should set `perspective` for depth (see .feature-card-outer in CSS).
 *
 * Touch devices keep the tap-press (tactile on mobile) but skip the tilt;
 * reduced motion renders a plain element.
 */
export function Tilt({
  children,
  maxX = 6,
  maxY = 8,
  lift = -6,
  scale = 1.02,
  className,
}: TiltProps) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [fine, setFine] = useState(false)

  const spring = { stiffness: 220, damping: 20, mass: 0.6 }
  const rotateX = useSpring(0, spring)
  const rotateY = useSpring(0, spring)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    setFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches)
  }, [])

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  function handleMove(event: ReactPointerEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const nx = (event.clientX - rect.left) / rect.width - 0.5
    const ny = (event.clientY - rect.top) / rect.height - 0.5
    rotateY.set(nx * maxY * 2)
    rotateX.set(-ny * maxX * 2)
  }

  function handleLeave() {
    rotateX.set(0)
    rotateY.set(0)
  }

  // One m.div for both modes — the rotate motion values must be bound to the
  // element from its very first render (Motion doesn't pick up motion values
  // added to `style` on a later re-render). On touch (`fine` false) they just
  // stay at 0 and only the tap press is active.
  return (
    <m.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={fine ? { y: lift, scale } : undefined}
      whileTap={{ scale: fine ? 0.99 : 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 22, mass: 0.6 }}
      onPointerMove={fine ? handleMove : undefined}
      onPointerLeave={fine ? handleLeave : undefined}
    >
      {children}
    </m.div>
  )
}

export default Tilt
