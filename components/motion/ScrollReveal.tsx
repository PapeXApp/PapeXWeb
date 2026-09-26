import type { CSSProperties, ElementType, ReactNode } from "react"
import "./motion.css"

/**
 * ScrollReveal — the SCROLL-LINKED rise-from-below for static sections
 * (Web 2.1 P3-R1, Nico: "I want it to appear from bottom to up as I scroll
 * down"; "yes playback").
 *
 * Why not `Reveal`: Reveal is a 700ms timer fired once by an
 * IntersectionObserver, so a visitor who stops scrolling watches it play, and
 * one who scrolls fast outruns it (NN/G: reveals that make people wait hurt
 * perception). Here the progress IS the element's position: a CSS
 * scroll-driven animation on its own view timeline (`animation-timeline:
 * view()`), transform + opacity only. It is finished by the time the element's
 * top is ~13–15% of the viewport height above the bottom edge (see
 * revealRange for why), so nobody ever waits, and it plays backwards when you scroll back up (fill-mode both, no
 * "once").
 *
 * `Reveal` stays as it was for the pinned scenes (their headers ride inside a
 * sticky pin, where a view timeline would track the pin, not the story) —
 * this is a separate primitive, migrated section by section.
 *
 * Pure CSS, no client JS: the server HTML is the final layout (a transform
 * never moves layout), so there is no hydration jump. The hidden state only
 * exists inside `@supports (animation-timeline: view())` + `prefers-reduced-
 * motion: no-preference` (motion.css), so older browsers and reduced motion
 * get the content fully shown and still. `data-reveal` lets the root
 * layout's <noscript> rule force it visible with JS off.
 *
 * `order` staggers pieces that sit side by side (same top, so the same view
 * timeline position): each step starts the range 1.5vh later. Stacked pieces
 * are staggered by their own positions already, so most callers leave it 0.
 */
type ScrollRevealProps = {
  children?: ReactNode
  /** Element tag. Default: 'div'. */
  as?: ElementType
  className?: string
  style?: CSSProperties
  /** 0-based stagger step for side-by-side pieces. Default: 0. */
  order?: number
  id?: string
  /** Extra attributes (e.g. data-*) passed through to the element. */
  [attr: `data-${string}`]: string | number | boolean | undefined
}

/** The body range, in vh of travel since the element's top met the
 *  viewport's bottom edge (`cover 0`). Headings use ScrollWords (shorter).
 *
 *  Why ~13vh and not the 35-45% ceiling from the research: on a full screen
 *  the lowest line (a CTA, the submit button, the last FAQ row) sits only
 *  ~16vh above the bottom edge when that screen is aligned — measured
 *  2026-09-25 at 1440x760 (the tightest desktop checked). A screen you land
 *  on (by scrolling or by its next-section arrow) must be fully revealed, so
 *  every range ends by 15vh. Side-by-side steps shift by 1.5vh. */
export function revealRange(order = 0): { from: number; to: number } {
  const step = Math.max(0, Math.min(order, 3))
  const from = 1 + step * 1.5
  return { from, to: Math.min(from + 12, 15) }
}

/** The range as CSS vars, for an element that must carry the reveal itself
 *  (className "papex-rv" + this style) instead of being wrapped. */
export function revealVars(order = 0): CSSProperties {
  const { from, to } = revealRange(order)
  return { "--rv-from": `${from}vh`, "--rv-to": `${to}vh` } as CSSProperties
}

export function ScrollReveal({ children, as = "div", className, style, order = 0, id, ...data }: ScrollRevealProps) {
  const Tag = as as ElementType
  const vars = revealVars(order)
  return (
    <Tag
      {...data}
      id={id}
      className={["papex-rv", className].filter(Boolean).join(" ")}
      style={{ ...vars, ...style }}
      data-reveal=""
    >
      {children}
    </Tag>
  )
}

export default ScrollReveal
