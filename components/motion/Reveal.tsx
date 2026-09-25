"use client"

import { useEffect, useRef, useState } from "react"
import { useInView } from "motion/react"
import { useSafeReducedMotion } from "./useSafeReducedMotion"
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

// Entrance = opacity + blur + a SMALL move. The old 46px slide read as
// "things flying in"; a 14px rise that comes into focus reads as the page
// settling. (a16z speedrun study, .claude/plans/2026-09-10-website-flow-and-depth.md)
const EASE = "cubic-bezier(.16,1,.3,1)"
const DURATION = 0.7
const RISE = 14
const SHIFT = 28
const BLUR = "blur(8px)"
// The 'mask' variant (clip-path wipe) has its own easing/duration.
const MASK_EASE = "cubic-bezier(.7,0,.15,1)"
const MASK_DURATION = 1.1

const VIEWPORT = { once: true, amount: 0.12, margin: "0px 0px -6% 0px" } as const
// The mask variant CANNOT use an area threshold. Chrome's IntersectionObserver
// clips the target by its own clip-path, so a fully wiped-out element
// (inset(0 100% 0 0)) has zero intersecting area forever and never reveals —
// measured 2026-09-10: every mask reveal on both paths (the Features app
// shots, the RDH image, the dashboard screenshot) sat blank in view. It now
// fires on ANY intersection, and the hidden state keeps a 1px sliver so there
// is always some area to intersect.
const VIEWPORT_MASK = { once: true, amount: 0, margin: "0px 0px -12% 0px" } as const

function hiddenStyle(variant: RevealVariant): CSSProperties {
  switch (variant) {
    case "left":
      return { opacity: 0, transform: `translateX(-${SHIFT}px)`, filter: BLUR }
    case "right":
      return { opacity: 0, transform: `translateX(${SHIFT}px)`, filter: BLUR }
    case "scale":
      return { opacity: 0, transform: "scale(.96)", filter: BLUR }
    case "mask":
      return { clipPath: "inset(0 calc(100% - 1px) 0 0)" }
    case "up":
    default:
      return { opacity: 0, transform: `translateY(${RISE}px)`, filter: BLUR }
  }
}

function visibleStyle(variant: RevealVariant, settled: boolean): CSSProperties {
  if (variant === "mask") return { clipPath: "inset(0 0 0 0)" }
  // Once settled the filter is dropped entirely rather than left at blur(0):
  // any non-`none` filter keeps a stacking context and a compositing layer
  // alive for no visual reason.
  return settled ? { opacity: 1, transform: "none" } : { opacity: 1, transform: "none", filter: "blur(0px)" }
}

/**
 * The workhorse scroll-reveal primitive. IntersectionObserver-driven (threshold
 * .12, rootMargin 0px 0px -6% 0px), fires once. Default `up`: opacity +
 * blur(8px→0) + a 14px rise over 700ms cubic-bezier(.16,1,.3,1). `left` /
 * `right` / `scale` get the same blur-in; `mask` is a clip-path wipe with its
 * own 1100ms timing.
 *
 * Renders children in their FINAL state immediately under `prefers-reduced-motion:
 * reduce` — no blur, no translate, never stuck invisible.
 */
export function Reveal({ children, variant = "up", delay = 0, as = "div", className, style }: RevealProps) {
  const prefersReduced = useSafeReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, variant === "mask" ? VIEWPORT_MASK : VIEWPORT)
  const [settled, setSettled] = useState(false)
  const Tag = as as ElementType

  const isMask = variant === "mask"
  const duration = isMask ? MASK_DURATION : DURATION

  useEffect(() => {
    if (!inView || prefersReduced) return
    const timer = window.setTimeout(() => setSettled(true), (delay + duration) * 1000 + 60)
    return () => window.clearTimeout(timer)
  }, [inView, prefersReduced, delay, duration])

  if (prefersReduced) {
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    )
  }

  const ease = isMask ? MASK_EASE : EASE
  const willChangeProp = isMask ? "clip-path" : "opacity, transform, filter"
  const transition = isMask
    ? `clip-path ${duration}s ${ease} ${delay}s`
    : `opacity ${duration}s ${ease} ${delay}s, transform ${duration}s ${ease} ${delay}s, filter ${duration}s ${ease} ${delay}s`

  const computedStyle: CSSProperties = {
    ...style,
    ...(inView ? visibleStyle(variant, settled) : hiddenStyle(variant)),
    transition,
    willChange: settled ? undefined : willChangeProp,
  }

  // data-reveal marks the hidden-until-scrolled state for the root layout's
  // <noscript> rule (NO_JS_REVEAL_CSS in app/layout.tsx): with JS off
  // useInView never fires, so without it the content would stay at opacity 0.
  // Inert with JS on — nothing else selects it.
  return (
    <Tag ref={ref} className={className} style={computedStyle} data-reveal={isMask ? "mask" : ""}>
      {children}
    </Tag>
  )
}

export default Reveal
