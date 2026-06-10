"use client"

import {
  m,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react"
import { useRef } from "react"
import type { ElementType, ReactNode } from "react"

export type ParallaxAxis = "x" | "y"

type ParallaxProps = {
  children: ReactNode
  /**
   * Strength of the parallax travel, in pixels. The element shifts by roughly
   * +/- this amount across the scroll range. Negative values invert direction.
   * Default: 60.
   */
  intensity?: number
  /** Axis to translate along. Default: 'y'. */
  axis?: ParallaxAxis
  /** Element tag to render. Default: 'div'. */
  as?: ElementType
  className?: string
}

/**
 * Generic scroll-driven parallax helper for later hero use. Maps the element's
 * scroll progress (as it passes through the viewport) onto a translation, then
 * smooths it with a spring for buttery motion.
 *
 * No-ops (plain element, no transform) under reduced motion.
 */
export function Parallax({
  children,
  intensity = 60,
  axis = "y",
  as = "div",
  className,
}: ParallaxProps) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const MComponent = m[as as keyof typeof m] as typeof m.div

  // useScroll relative to this element traversing the viewport.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  // progress 0 -> 1 maps to -intensity -> +intensity
  const raw = useTransform(scrollYProgress, [0, 1], [-intensity, intensity])
  const smooth = useSpring(raw, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  })

  if (prefersReduced) {
    const Tag = as
    return (
      <Tag ref={ref} className={className}>
        {children}
      </Tag>
    )
  }

  const style = axis === "y" ? { y: smooth } : { x: smooth }

  return (
    <MComponent ref={ref} className={className} style={style}>
      {children}
    </MComponent>
  )
}

export default Parallax
