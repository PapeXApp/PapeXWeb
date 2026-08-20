'use client'

import { useEffect, useState } from 'react'

/**
 * Counts up to `value` shortly after mount. `format` adds suffixes (e.g. "12M+").
 * Deliberately not scroll-gated: it always resolves to the final value, so the
 * number is never stuck at 0 even if the element never enters the viewport.
 */
export function StatCounter({
  value,
  duration = 1600,
  startDelay = 250,
  format = (n) => n.toLocaleString(),
  className,
  style,
}: {
  value: number
  duration?: number
  startDelay?: number
  format?: (n: number) => string
  className?: string
  style?: React.CSSProperties
}) {
  const [n, setN] = useState(0)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setN(value)
      return
    }
    let raf = 0
    let start = 0
    let timer = 0
    const step = (t: number) => {
      if (!start) start = t
      const p = Math.min((t - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(eased * value))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    timer = window.setTimeout(() => {
      raf = requestAnimationFrame(step)
    }, startDelay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [value, duration, startDelay])

  return (
    <span className={className} style={style}>
      {format(n)}
    </span>
  )
}
