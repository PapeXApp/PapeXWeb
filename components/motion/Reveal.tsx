"use client"

import { useEffect, useRef, useState } from "react"
import { useInView, useReducedMotion } from "motion/react"
import type { CSSProperties, ElementType, ReactNode } from "react"

export type RevealVariant = "up" | "left" | "right" | "scale" | "mask"

type RevealProps = {
  children: ReactNode
  /** Direction/style the element enters from. Default: 'up'. */
  variant?: RevealVariant
  /** Delay before the animation starts, in seconds. Default: 0. */
  delay?: number
  /** Element tag to render. Default: 'div'. */
  as?: ElementType
  className?: string
  style?: CSSProperties
}

// Primary reveal easing/duration, per the forked-landing motion spec.
const EASE = "cubic-bezier(.16,1,.3,1)"
const DURATION = 0.9
// The 'mask' variant (clip-path wipe) has its own easing/duration.
const MASK_EASE = "cubic-bezier(.7,0,.15,1)"
const MASK_DURATION = 1.1

const VIEWPORT = { once: true, amount: 0.12, margin: "0px 0px -6% 0px" } as const

function hiddenStyle(variant: RevealVariant): CSSProperties {
  switch (variant) {
    case "left":
      return { opacity: 0, transform: "translateX(-48px)" }
    case "right":
      return { opacity: 0, transform: "translateX(48px)" }
    case "scale":
      return { opacity: 0, transform: "scale(.92)" }
    case "mask":
      return { clipPath: "inset(0 100% 0 0)" }
    case "up":
    default:
      return { opacity: 0, transform: "translateY(46px)" }
  }
}

function visibleStyle(variant: RevealVariant): CSSProperties {
  if (variant === "mask") return { clipPath: "inset(0 0 0 0)" }
  return { opacity: 1, transform: "none" }
}

/**
 * The workhorse scroll-reveal primitive. IntersectionObserver-driven (threshold
 * .12, rootMargin 0px 0px -6% 0px), fires once then unobserves. Variants: `up`
 * (default, translateY(46px)), `left` (translateX(-48px)), `right` (+48px),
 * `scale` (scale(.92)), `mask` (clip-path wipe, its own 1100ms timing).
 *
 * Renders children in their FINAL state immediately under `prefers-reduced-motion:
 * reduce` — never stuck invisible.
 */
export function Reveal({ children, variant = "up", delay = 0, as = "div", className, style }: RevealProps) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, VIEWPORT)
  const [animating, setAnimating] = useState(false)
  const Tag = as as ElementType

  useEffect(() => {
    if (inView) setAnimating(true)
  }, [inView])

  if (prefersReduced) {
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    )
  }

  const isMask = variant === "mask"
  const duration = isMask ? MASK_DURATION : DURATION
  const ease = isMask ? MASK_EASE : EASE
  const willChangeProp = isMask ? "clip-path" : "opacity, transform"
  const transition = isMask
    ? `clip-path ${duration}s ${ease} ${delay}s`
    : `opacity ${duration}s ${ease} ${delay}s, transform ${duration}s ${ease} ${delay}s`

  const computedStyle: CSSProperties = {
    ...style,
    ...(inView ? visibleStyle(variant) : hiddenStyle(variant)),
    transition,
    willChange: animating ? willChangeProp : undefined,
  }

  return (
    <Tag
      ref={ref}
      className={className}
      style={computedStyle}
      onTransitionEnd={() => setAnimating(false)}
    >
      {children}
    </Tag>
  )
}

export default Reveal
