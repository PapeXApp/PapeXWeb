import type { CSSProperties } from "react"
import type { HeadingLevel } from "./WordReveal"
import "./motion.css"

// WordReveal's separator (U+00A0), so wraps land in the same places.
const WORD_SPACE = "\u00A0"

type ScrollWordsProps = {
  /** The heading's plain text; split on whitespace into words. */
  children: string
  /** Heading level. Default: 'h2'. */
  as?: HeadingLevel
  className?: string
  style?: CSSProperties
}

/**
 * The scroll-linked twin of WordReveal for headings in static sections
 * (Web 2.1 P3-R1). Same look — each word rises out of its own clipped line
 * box — but the progress is the heading's position, not a timer: the heading
 * is a named view timeline and each word takes a staggered slice of it
 * (motion.css `.papex-rw*`). The whole heading resolves within ~13.5vh of
 * travel after its top clears the bottom of the viewport ("headlines resolve
 * quickly"), and it plays backwards on the way up.
 *
 * The per-word markup is WordReveal's exactly (inline-block wraps with the
 * same padding/margin), so a heading swapped from WordReveal keeps its line
 * breaks and height. `aria-label` carries the full string; the word spans are
 * aria-hidden. Server-rendered, no JS; hidden states exist only inside the
 * @supports + no-preference block, and `data-reveal` covers no-JS.
 */
export function ScrollWords({ children, as = "h2", className, style }: ScrollWordsProps) {
  const Tag = as
  const content = children.trim()
  const words = content.split(/\s+/)
  const n = words.length
  return (
    <Tag className={["papex-rw", className].filter(Boolean).join(" ")} style={style} aria-label={content}>
      {words.map((word, i) => (
        <span key={i} aria-hidden="true" className="papex-rw-wrap">
          <span className="papex-rw-word" style={{ "--i": i, "--n": n } as CSSProperties} data-reveal="">
            {word}
          </span>
          {i < n - 1 ? WORD_SPACE : null}
        </span>
      ))}
    </Tag>
  )
}

export default ScrollWords
