"use client"

import { useEffect, useState } from "react"
import { useReducedMotion } from "motion/react"

/**
 * `useReducedMotion`, but `false` until the component has hydrated.
 *
 * Why: motion's hook reads matchMedia synchronously on the client's FIRST
 * render, while the server always renders the animated markup. Components
 * that branch their markup on it (WordReveal's per-word spans, Marquee's
 * duplicated track, Reveal/ChildStagger's styles) therefore failed hydration
 * for every reduced-motion visitor — measured 2026-09-10: "Hydration failed
 * because the server rendered HTML didn't match the client". Rendering the
 * server's markup first and switching to the static branch right after mount
 * keeps hydration clean; the static branch still arrives before any
 * animation could have run.
 */
export function useSafeReducedMotion(): boolean {
  const reduced = useReducedMotion()
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated && Boolean(reduced)
}
