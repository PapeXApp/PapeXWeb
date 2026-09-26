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
 * A heading carries the whole statement as its aria-label and the word
 * spans are aria-hidden (same as ScrollWords): computed from the spans, the
 * accessible name lost its spaces ("Followonereceipt.", measured P3-B8).
 */
export function ScrollLit({ text, as = "p", className, style }: ScrollLitProps) {
  const Tag = as as ElementType
  const words = text.trim().split(/\s+/)
  const n = words.length
  // Only a heading may take aria-label (ARIA prohibits naming a paragraph);
  // other tags keep the words as their readable text.
  const labelled = typeof as === "string" && /^h[1-6]$/.test(as)
  return (
    <Tag className={["papex-lit", className].filter(Boolean).join(" ")} style={style} aria-label={labelled ? text.trim() : undefined}>
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden={labelled ? true : undefined}
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
