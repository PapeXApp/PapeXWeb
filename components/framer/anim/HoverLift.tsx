"use client"

import { m, useReducedMotion } from "motion/react"
import type { ElementType, ReactNode } from "react"

type HoverLiftProps = {
  children: ReactNode
  /** Vertical lift on hover, in pixels (negative = up). Default: -6. */
  lift?: number
  /** Scale on hover. Default: 1.02. */
  scale?: number
  /** Scale on tap/press. Default: 0.99. */
  tapScale?: number
  /** Element tag to render. Default: 'div'. */
  as?: ElementType
  className?: string
}

/**
 * Tactile hover-lift wrapper. Raises + subtly scales its element on hover and
 * gently presses on tap, using a snappy spring. Transform-only (GPU friendly).
 *
 * No-ops (plain element, no motion) under reduced motion.
 */
export function HoverLift({
  children,
  lift = -6,
  scale = 1.02,
  tapScale = 0.99,
  as = "div",
  className,
}: HoverLiftProps) {
  const prefersReduced = useReducedMotion()
  const MComponent = m[as as keyof typeof m] as typeof m.div

  if (prefersReduced) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MComponent
      className={className}
      whileHover={{ y: lift, scale }}
      whileTap={{ scale: tapScale }}
      transition={{ type: "spring", stiffness: 320, damping: 22, mass: 0.6 }}
    >
      {children}
    </MComponent>
  )
}

export default HoverLift
