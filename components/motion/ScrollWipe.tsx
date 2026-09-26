import type { CSSProperties, ElementType, ReactNode } from "react"
import { revealVars } from "./ScrollReveal"
import "./motion.css"

/**
 * ScrollWipe — ScrollReveal's sideways sibling (Web 2.1 P3-C5, Nico: "add
 * back the animation of the cards swiping right to left or left to right,
 * depending on the side it is, to open the visual of the app").
 *
 * The element OPENS with a horizontal clip-path wipe plus a short slide, both
 * coming from one side: `from="right"` uncovers it right → left (for a visual
 * that sits on the right of its row), `from="left"` left → right. Same house
 * pattern as ScrollReveal: a CSS scroll-driven animation on the element's own
 * view timeline, the same body range (revealRange — done by ~15vh of travel,
 * so a screen you land on is complete), and it plays backwards on scroll-up.
 *
 * It replaces the old `<Reveal variant="mask">` wipe, which was a one-shot
 * IntersectionObserver timer (and needed a 1px sliver to beat Chrome's
 * clip-path-aware IO). A view timeline tracks the element's box, which a clip
 * never changes, so it starts fully clipped.
 *
 * DIRECTION FROM CSS. The side is the custom property `--wipe-dir` (1 = from
 * the right, -1 = from the left). `from` sets it through a data attribute; a
 * caller whose side depends on layout (a container query that mirrors a row)
 * can set `--wipe-dir` on the element from its own stylesheet instead —
 * any selector with more than one class outranks the default.
 *
 * Pure CSS, no client JS, so no hydration jump. The hidden state only exists
 * inside `@supports (animation-timeline: view())` + `prefers-reduced-motion:
 * no-preference` (motion.css). `data-reveal="mask"` makes the root layout's
 * <noscript> rule force it open (clip-path none, transform none) with JS off.
 *
 * The clip opens past the element's edges by --wipe-bleed (default 80px) so
 * a child's shadow is not cut off once it is open.
 */
type ScrollWipeProps = {
  children?: ReactNode
  /** Element tag. Default: 'div'. */
  as?: ElementType
  className?: string
  style?: CSSProperties
  /** The side the wipe comes from. Default: 'right'. */
  from?: "left" | "right"
  /** 0-based stagger step (see ScrollReveal). Default: 0. */
  order?: number
  id?: string
  /** Extra attributes (e.g. data-*) passed through to the element. */
  [attr: `data-${string}`]: string | number | boolean | undefined
}

export function ScrollWipe({ children, as = "div", className, style, from = "right", order = 0, id, ...data }: ScrollWipeProps) {
  const Tag = as as ElementType
  return (
    <Tag
      {...data}
      id={id}
      className={["papex-wipe", className].filter(Boolean).join(" ")}
      style={{ ...revealVars(order), ...style }}
      data-wipe-from={from}
      data-reveal="mask"
    >
      {children}
    </Tag>
  )
}

export default ScrollWipe
