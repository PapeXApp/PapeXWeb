"use client"

import { useEffect, useRef, useState } from "react"
import { useInView, useReducedMotion } from "motion/react"
import type { CSSProperties } from "react"

type CounterProps = {
  /** Final value to count up to. */
  value: number
  /** Text placed before the formatted number, e.g. for `256B`. */
  prefix?: string
  /** Text placed after the formatted number, e.g. for `10M`. */
  suffix?: string
  className?: string
  style?: CSSProperties
  /** Locale passed to `toLocaleString`. Default: 'en-US'. */
  locale?: string
}

const DURATION = 1600

function easeOutCubic(p: number): number {
  return 1 - Math.pow(1 - p, 3)
}

const VIEWPORT = { once: true, amount: 0.12, margin: "0px 0px -6% 0px" } as const

/**
 * Counts up from 0 to `value` when it scrolls into view, once only. 1600ms,
 * ease-out cubic, formatted with `toLocaleString`. Guards against re-running
 * (via a ref, independent of React strict-mode double effects).
 *
 * Shows the final value immediately, with no counting animation, under
 * `prefers-reduced-motion: reduce`.
 */
export function Counter({ value, prefix = "", suffix = "", className, style, locale = "en-US" }: CounterProps) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, VIEWPORT)
  const [display, setDisplay] = useState(0)
  const startedRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (prefersReduced || !inView || startedRef.current) return
    startedRef.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION)
      setDisplay(Math.floor(value * easeOutCubic(p)))
      rafRef.current = p < 1 ? requestAnimationFrame(tick) : null
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [inView, prefersReduced, value])

  const shown = prefersReduced ? value : display

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}
      {shown.toLocaleString(locale)}
      {suffix}
    </span>
  )
}

export default Counter
