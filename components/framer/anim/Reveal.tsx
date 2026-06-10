"use client"

import { m, useReducedMotion } from "motion/react"
import type { Variants } from "motion/react"
import { createContext, useContext } from "react"
import type { ElementType, ReactNode } from "react"

export type RevealDirection = "up" | "down" | "left" | "right"

const DISTANCE = 24

/**
 * Initial offset for a given direction. The element animates *from* this offset
 * back to its resting position (0,0).
 */
function offsetFor(direction: RevealDirection): { x: number; y: number } {
  switch (direction) {
    case "up":
      return { x: 0, y: DISTANCE }
    case "down":
      return { x: 0, y: -DISTANCE }
    case "left":
      return { x: DISTANCE, y: 0 }
    case "right":
      return { x: -DISTANCE, y: 0 }
  }
}

const VIEWPORT = { once: true, margin: "0px 0px -10% 0px" } as const

/**
 * Context flag set by RevealGroup. When a Reveal is rendered inside a group it
 * skips its own whileInView trigger and instead participates in the parent's
 * stagger orchestration via variants.
 */
const RevealGroupContext = createContext(false)

type CommonProps = {
  children: ReactNode
  /** Delay before the animation starts, in seconds. */
  delay?: number
  /** Direction the element travels *from*. Default: 'up'. */
  direction?: RevealDirection
  /** Element tag to render. Default: 'div'. */
  as?: ElementType
  className?: string
  /**
   * When true, the element also gains a tactile hover-lift + tap-press
   * (transform only) once revealed. No-ops under reduced motion alongside the
   * reveal. Default: false.
   */
  hoverLift?: boolean
}

/** Spring + targets for the optional hover-lift / tap-press gesture. */
const HOVER_LIFT = {
  whileHover: {
    y: -6,
    scale: 1.02,
    transition: { type: "spring" as const, stiffness: 320, damping: 22, mass: 0.6 },
  },
  whileTap: {
    scale: 0.99,
    transition: { type: "spring" as const, stiffness: 320, damping: 22, mass: 0.6 },
  },
}

/**
 * The workhorse scroll-reveal primitive. Fades + slides children in when they
 * enter the viewport (once). No-ops (renders a plain element, no animation)
 * when the user prefers reduced motion.
 *
 * Can be used standalone, or nested inside <RevealGroup> to be staggered.
 */
export function Reveal({
  children,
  delay = 0,
  direction = "up",
  as = "div",
  className,
  hoverLift = false,
}: CommonProps) {
  const prefersReduced = useReducedMotion()
  const inGroup = useContext(RevealGroupContext)
  const MComponent = m[as as keyof typeof m] as typeof m.div

  if (prefersReduced) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  const offset = offsetFor(direction)
  const variants: Variants = {
    hidden: { opacity: 0, ...offset },
    visible: { opacity: 1, x: 0, y: 0 },
  }

  const hoverProps = hoverLift ? HOVER_LIFT : undefined

  // Inside a group, the parent drives orchestration via variants/staggerChildren.
  if (inGroup) {
    return (
      <MComponent
        className={className}
        variants={variants}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
        {...hoverProps}
      >
        {children}
      </MComponent>
    )
  }

  return (
    <MComponent
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={variants}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      {...hoverProps}
    >
      {children}
    </MComponent>
  )
}

type RevealGroupProps = {
  children: ReactNode
  /** Per-child stagger in seconds. Default: 0.12. */
  stagger?: number
  /** Delay before the first child animates, in seconds. */
  delay?: number
  as?: ElementType
  className?: string
}

/**
 * Wrapper that staggers any <Reveal> children. The group is the scroll trigger;
 * each child Reveal animates in sequence. No-ops under reduced motion.
 *
 * Example:
 *   <RevealGroup stagger={0.1}>
 *     <Reveal>...</Reveal>
 *     <Reveal>...</Reveal>
 *   </RevealGroup>
 */
export function RevealGroup({
  children,
  stagger = 0.12,
  delay = 0,
  as = "div",
  className,
}: RevealGroupProps) {
  const prefersReduced = useReducedMotion()
  const MComponent = m[as as keyof typeof m] as typeof m.div

  if (prefersReduced) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  }

  return (
    <RevealGroupContext.Provider value={true}>
      <MComponent
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        variants={container}
      >
        {children}
      </MComponent>
    </RevealGroupContext.Provider>
  )
}

export default Reveal
