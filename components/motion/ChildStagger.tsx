"use client"

import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from "react"
import { useInView, useReducedMotion } from "motion/react"
import type { CSSProperties, ElementType, ReactElement, ReactNode } from "react"

type StyleableProps = { style?: CSSProperties }

type ChildStaggerProps = {
  /** Direct children to stagger in. Non-element children (text/fragments) pass through unanimated. */
  children: ReactNode
  /** Element tag for the wrapping container. Default: 'div'. */
  as?: ElementType
  className?: string
  style?: CSSProperties
  /** Delay, in seconds, before the first child starts. Default: 0. */
  delay?: number
}

const EASE = "cubic-bezier(.16,1,.3,1)"
const DURATION = 0.75
const STAGGER = 0.08

const VIEWPORT = { once: true, amount: 0.12, margin: "0px 0px -6% 0px" } as const

/**
 * Staggers its direct children in from `translateY(30px)`/`opacity:0`, 750ms
 * with an 80ms per-child stagger, triggered once the container enters view.
 * Used on hero copy columns / step lists.
 *
 * Applies the animated style directly to each child element (no extra wrapper
 * nodes) via `cloneElement`, so children must accept a `style` prop.
 *
 * Renders children in their final (visible) state immediately under
 * `prefers-reduced-motion: reduce`.
 */
export function ChildStagger({ children, as = "div", className, style, delay = 0 }: ChildStaggerProps) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, VIEWPORT)
  const [settled, setSettled] = useState(false)
  const Tag = as as ElementType
  const items = Children.toArray(children)

  useEffect(() => {
    if (!inView || prefersReduced) return
    const total = delay + Math.max(0, items.length - 1) * STAGGER + DURATION
    const timer = window.setTimeout(() => setSettled(true), total * 1000)
    return () => window.clearTimeout(timer)
  }, [inView, prefersReduced, delay, items.length])

  if (prefersReduced) {
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    )
  }

  return (
    <Tag ref={ref} className={className} style={style}>
      {items.map((child, i) => {
        if (!isValidElement(child)) return child
        const el = child as ReactElement<StyleableProps>
        const childDelay = delay + i * STAGGER
        const style: CSSProperties = {
          ...el.props.style,
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(30px)",
          transition: `opacity ${DURATION}s ${EASE} ${childDelay}s, transform ${DURATION}s ${EASE} ${childDelay}s`,
          willChange: settled ? undefined : "opacity, transform",
        }
        return cloneElement(el, { style })
      })}
    </Tag>
  )
}

export default ChildStagger
