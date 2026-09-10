import type { CSSProperties, ElementType } from "react"
import "./motion.css"

type ScrollLitProps = {
  /** The statement, as plain text. Split on whitespace into words. */
  text: string
  /** Element to render. Default: 'p'. */
  as?: ElementType
  className?: string
  style?: CSSProperties
}

/**
 * A statement whose words start dim (~22% opacity) and light up one after
 * another as the paragraph scrolls up through the viewport.
 *
 * Pure CSS — no JS, no listener. The paragraph is a named view timeline and
 * each word's opacity animation is placed on a staggered slice of it
 * (motion.css, `.papex-lit-*`). Where scroll-driven animations aren't
 * supported, and under prefers-reduced-motion, the words are simply fully lit:
 * the dim state only exists inside the @supports/no-preference block, so
 * there is no way for the text to get stuck faded.
 *
 * Words stay inline text nodes in one element, so screen readers read the
 * statement normally.
 */
export function ScrollLit({ text, as = "p", className, style }: ScrollLitProps) {
  const Tag = as as ElementType
  const words = text.trim().split(/\s+/)
  const n = words.length
  return (
    <Tag className={["papex-lit", className].filter(Boolean).join(" ")} style={style}>
      {words.map((word, i) => (
        <span
          key={i}
          className="papex-lit-word"
          style={{ "--i": i, "--n": n } as CSSProperties}
        >
          {word}
          {i < n - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  )
}

export default ScrollLit
