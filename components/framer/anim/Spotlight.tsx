"use client"

import {
  m,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react"
import { useEffect, useRef, useState } from "react"
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react"

type SpotlightMode = "section" | "card"

type SpotlightProps = {
  /**
   * "section" (default): a large soft glow that follows the pointer anywhere
   * within the container — used as a background/overlay layer (e.g. a hero
   * backdrop). The glow is always visible while the pointer is inside.
   *
   * "card": a tighter radial light that fades in on hover and tracks the cursor
   * within the element — the classic "spotlight card" effect.
   */
  mode?: SpotlightMode
  /** CSS color for the glow core. Default: brand orange tint. */
  color?: string
  /** Radius of the glow, in pixels. Default: 520 (section) / 240 (card). */
  radius?: number
  /** Peak opacity of the glow layer. Default: 0.5 (section) / 0.85 (card). */
  intensity?: number
  /**
   * Spring stiffness/damping for the follow lag. Higher stiffness = snappier.
   * Default tuned for a buttery trailing feel.
   */
  stiffness?: number
  damping?: number
  /** Extra class on the wrapper element. */
  className?: string
  /** Inline style on the wrapper element. */
  style?: CSSProperties
  /**
   * Wrapper children. For "card" mode this is the card content; the glow is
   * painted as a layer *behind* it. For "section" mode children are optional.
   */
  children?: ReactNode
  /** z-index of the glow layer relative to the wrapper. Default: 0. */
  glowZIndex?: number
  /**
   * Blend mode for the glow layer. Default: "screen" for "section" (glows nicely
   * over imagery) and "normal" for "card" (a tint over a light card surface).
   */
  blendMode?: CSSProperties["mixBlendMode"]
}

const DEFAULTS: Record<
  SpotlightMode,
  { radius: number; intensity: number; color: string }
> = {
  section: { radius: 520, intensity: 0.5, color: "rgba(255, 153, 51, 0.55)" },
  card: { radius: 240, intensity: 0.85, color: "rgba(255, 153, 51, 0.45)" },
}

/**
 * Brand mouse-follow spotlight. Renders a radial-gradient glow that smoothly
 * trails the pointer inside its container, layered behind its children with
 * `pointer-events: none` so it never intercepts clicks (the native cursor and
 * all underlying interactions are preserved).
 *
 * Desktop / fine-pointer only: on touch devices and under reduced motion it
 * renders its children untouched (no glow, no listeners). matchMedia is read in
 * an effect, so SSR markup is stable and there is no hydration mismatch.
 *
 * GPU-friendly: only the glow layer's radial-gradient position + opacity change;
 * no layout is touched. Follow lag is driven by Motion springs.
 */
export function Spotlight({
  mode = "section",
  color,
  radius,
  intensity,
  stiffness = 220,
  damping = 28,
  className,
  style,
  children,
  glowZIndex = 0,
  blendMode,
}: SpotlightProps) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)

  const d = DEFAULTS[mode]
  const glowColor = color ?? d.color
  const glowRadius = radius ?? d.radius
  const glowIntensity = intensity ?? d.intensity

  // Pointer position within the container, spring-smoothed for a trailing feel.
  const spring = { stiffness, damping, mass: 0.5 }
  const x = useSpring(useMotionValue(0), spring)
  const y = useSpring(useMotionValue(0), spring)
  // Opacity is springed too so "card" mode fades in/out smoothly on enter/leave.
  const opacity = useSpring(useMotionValue(mode === "section" ? 0 : 0), {
    stiffness: 180,
    damping: 30,
  })

  const background = useMotionTemplate`radial-gradient(${glowRadius}px circle at ${x}px ${y}px, ${glowColor} 0%, transparent 70%)`

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const ok =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !prefersReduced
    setEnabled(ok)
  }, [prefersReduced])

  function handleMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!enabled || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set(event.clientX - rect.left)
    y.set(event.clientY - rect.top)
    opacity.set(glowIntensity)
  }

  function handleEnter(event: ReactPointerEvent<HTMLDivElement>) {
    if (!enabled || !ref.current) return
    // Jump the spring to the entry point so the glow doesn't streak in from a
    // stale corner, then fade up.
    const rect = ref.current.getBoundingClientRect()
    x.jump(event.clientX - rect.left)
    y.jump(event.clientY - rect.top)
    opacity.set(glowIntensity)
  }

  function handleLeave() {
    opacity.set(0)
  }

  // No-op branch: touch / reduced motion. Children pass through untouched so
  // layout and existing behavior are identical to having no wrapper at all.
  // `display: contents` removes the wrapper box from layout so card padding /
  // flex rules apply to the children exactly as before.
  if (!enabled) {
    if (children === undefined) return null
    return (
      <div className={className} style={{ display: "contents", ...style }}>
        {children}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{ position: "relative", ...style }}
      onPointerEnter={handleEnter}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <m.div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: glowZIndex,
          background,
          opacity,
          pointerEvents: "none",
          mixBlendMode: blendMode ?? (mode === "section" ? "screen" : "normal"),
          borderRadius: "inherit",
        }}
      />
      {children}
    </div>
  )
}

export default Spotlight
