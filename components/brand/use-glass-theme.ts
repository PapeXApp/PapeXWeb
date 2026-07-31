'use client'

// components/brand/use-glass-theme.ts
//
// Picks the nav's glass variant from whatever is actually underneath it.
//
// Why: the dark "liquid glass" bubbles (rgba(8,26,37,.5) + light text) wash out
// badly over the #F5F5F5 sections — verified in the prototype. The README's
// contrast caveat says to add a scroll-aware light variant rather than change
// the bubble geometry, so that's what this drives.
//
// Detection is deliberately zero-cooperation: it probes the element under the
// nav's left gutter and walks up until it finds either an explicit
// `data-nav-theme="light|dark"` opt-out or a real (non-transparent) background
// colour, then decides on relative luminance. That means section components
// written by other people need no knowledge of the nav — but can still override
// it with one attribute when a background-image defeats the heuristic.

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export type GlassTheme = 'dark' | 'light'

/** x: left gutter, clear of the logo bubble (which starts at >= 14px). */
const PROBE_X = 4
/** y: vertical centre of the nav bar. */
const PROBE_Y = 32
/** sRGB relative luminance above which we switch to the light bubbles. */
const LIGHT_THRESHOLD = 0.45

function parseColor(value: string): { l: number; a: number } | null {
  const m = value.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number)
  if (parts.length < 3 || parts.some(Number.isNaN)) return null
  const [r, g, b] = parts
  const a = parts.length > 3 ? parts[3] : 1
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return { l: 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b), a }
}

function probeTheme(fallback: GlassTheme): GlassTheme {
  let el = document.elementFromPoint(PROBE_X, PROBE_Y)
  let hops = 0
  while (el && el !== document.documentElement && hops < 24) {
    hops += 1
    const tagged = (el as HTMLElement).dataset?.navTheme
    if (tagged === 'light' || tagged === 'dark') return tagged
    const parsed = parseColor(getComputedStyle(el).backgroundColor)
    if (parsed && parsed.a > 0.5) {
      return parsed.l > LIGHT_THRESHOLD ? 'light' : 'dark'
    }
    el = el.parentElement
  }
  return fallback
}

export function useGlassTheme(initial: GlassTheme): GlassTheme {
  const [theme, setTheme] = useState<GlassTheme>(initial)
  const pathname = usePathname()
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    const measure = () => {
      rafRef.current = null
      if (cancelled) return
      const next = probeTheme(initial)
      setTheme((prev) => (prev === next ? prev : next))
    }
    const schedule = () => {
      if (rafRef.current !== null) return
      rafRef.current = window.requestAnimationFrame(measure)
    }

    schedule()
    // Sections mounted after first paint (images, client sections) can change
    // what sits under the nav; re-probe once the page has settled.
    const settle = window.setTimeout(schedule, 400)

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelled = true
      window.clearTimeout(settle)
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [initial, pathname])

  return theme
}
