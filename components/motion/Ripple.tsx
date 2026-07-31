"use client"

import { useEffect, useRef } from "react"
import type { CSSProperties, ElementType, PointerEvent as ReactPointerEvent, ReactNode } from "react"

export type RippleVariant = "navy" | "orange"

type RippleProps = {
  children?: ReactNode
  /**
   * Ripple color. 'navy' (`rgba(0,18,29,.22)`) for orange CTAs, 'orange'
   * (`rgba(235,113,0,.15)`) for cards. Default: 'navy'.
   */
  variant?: RippleVariant
  /** Element to render as. Default: 'div'. */
  as?: ElementType
  className?: string
  style?: CSSProperties
}

const COLORS: Record<RippleVariant, string> = {
  navy: "rgba(0,18,29,.22)",
  orange: "rgba(235,113,0,.15)",
}

const LIFETIME = 720

/**
 * On `pointerdown`, appends an absolutely-positioned circle at the click
 * point (diameter `max(w,h)*2.2`), animates `scale(0)→scale(1)` with
 * `opacity .6→0`, and removes it after 720ms. The host is given
 * `position:relative; overflow:hidden` automatically, so it wraps its
 * interactive child (e.g. a `<button>`) rather than trying to *be* it.
 *
 * A discrete, single-shot pointer-feedback effect (not a continuous loop), so
 * it is not gated behind `prefers-reduced-motion`.
 */
export function Ripple({ children, variant = "navy", as = "div", className, style }: RippleProps) {
  const ref = useRef<HTMLDivElement>(null)
  const timers = useRef<Set<number>>(new Set())
  const Tag = as as ElementType

  useEffect(() => {
    const active = timers.current
    return () => {
      active.forEach((timer) => window.clearTimeout(timer))
      active.clear()
    }
  }, [])

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    const host = ref.current
    if (!host) return
    const rect = host.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2.2
    const span = document.createElement("span")
    span.style.cssText = [
      "position:absolute",
      "pointer-events:none",
      "border-radius:50%",
      `left:${event.clientX - rect.left - size / 2}px`,
      `top:${event.clientY - rect.top - size / 2}px`,
      `width:${size}px`,
      `height:${size}px`,
      `background:${COLORS[variant]}`,
      "transform:scale(0)",
      "opacity:.6",
      "will-change:transform, opacity",
      "transition:transform .6s ease-out, opacity .7s ease-out",
    ].join(";")
    host.appendChild(span)
    requestAnimationFrame(() => {
      span.style.transform = "scale(1)"
      span.style.opacity = "0"
    })
    const timer = window.setTimeout(() => {
      span.remove()
      timers.current.delete(timer)
    }, LIFETIME)
    timers.current.add(timer)
  }

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ position: "relative", overflow: "hidden", ...style }}
      onPointerDown={handlePointerDown}
    >
      {children}
    </Tag>
  )
}

export default Ripple
