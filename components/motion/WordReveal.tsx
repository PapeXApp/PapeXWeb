"use client"

import { useEffect, useRef, useState } from "react"
import { useInView, useReducedMotion } from "motion/react"
import type { CSSProperties } from "react"

export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

type WordRevealProps = {
  /**
   * The heading's plain-text content, split on spaces for the per-word
   * reveal. Accepted either as `text` or as a plain-string `children` — both
   * are supported so callers can use whichever reads better at the call
   * site; `text` wins if both are given.
   */
  text?: string
  children?: string
  /** Heading level to render as (preserves semantic markup). Default: 'h2'. */
  as?: HeadingLevel
  /** Delay, in seconds, before the first word starts. Default: 0. */
  delay?: number
  className?: string
  style?: CSSProperties
  /** Class applied to each inner animating word span. */
  wordClassName?: string
}

const EASE = "cubic-bezier(.16,1,.3,1)"
const DURATION = 0.85
const STAGGER = 0.055

const VIEWPORT = { once: true, amount: 0.12, margin: "0px 0px -6% 0px" } as const

// Zero-width, non-collapsible space used between rendered words so the visual
// line-wrap matches a normal space without a bare text node breaking up the
// per-word <span> markup.
const WORD_SPACE = " "

/**
 * Splits a heading on spaces and wraps each word in an `overflow:hidden` span
 * with an inner span animating from `translateY(115%)`/`opacity:0`, 850ms with
 * a 55ms stagger.
 *
 * Accessibility: the heading element carries `aria-label` with the full,
 * unsplit string, and the per-word markup is `aria-hidden`, so a screen reader
 * announces the heading as one normal string rather than word-by-word
 * fragments.
 *
 * Renders the full text immediately (no animation) under `prefers-reduced-motion:
 * reduce`.
 */
export function WordReveal({ text, children, as = "h2", delay = 0, className, style, wordClassName }: WordRevealProps) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLHeadingElement>(null)
  const inView = useInView(ref, VIEWPORT)
  const [settled, setSettled] = useState(false)
  const Tag = as
  const content = text ?? children ?? ""

  const words = content.trim().split(/\s+/)

  useEffect(() => {
    if (!inView || prefersReduced) return
    const total = delay + Math.max(0, words.length - 1) * STAGGER + DURATION
    const timer = window.setTimeout(() => setSettled(true), total * 1000)
    return () => window.clearTimeout(timer)
  }, [inView, prefersReduced, delay, words.length])

  if (prefersReduced) {
    return (
      <Tag ref={ref} className={className} style={style}>
        {content}
      </Tag>
    )
  }

  return (
    <Tag ref={ref} className={className} style={style} aria-label={content}>
      {words.map((word, i) => {
        const wordDelay = delay + i * STAGGER
        const wrapStyle: CSSProperties = {
          display: "inline-block",
          overflow: "hidden",
          verticalAlign: "top",
          paddingBottom: ".12em",
          marginBottom: "-.12em",
        }
        const innerStyle: CSSProperties = {
          display: "inline-block",
          transform: inView ? "translateY(0)" : "translateY(115%)",
          opacity: inView ? 1 : 0,
          transition: `transform ${DURATION}s ${EASE} ${wordDelay}s, opacity .6s ${wordDelay}s`,
          willChange: settled ? undefined : "transform, opacity",
        }
        return (
          <span key={i} aria-hidden="true" style={wrapStyle}>
            <span className={wordClassName} style={innerStyle}>
              {word}
            </span>
            {i < words.length - 1 ? WORD_SPACE : null}
          </span>
        )
      })}
    </Tag>
  )
}

export default WordReveal
