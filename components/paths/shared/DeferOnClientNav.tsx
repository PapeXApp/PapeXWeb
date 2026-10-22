"use client"

import { startTransition, useEffect, useState, type ReactNode } from "react"

/**
 * Builds a heavy, below-the-fold scene a moment AFTER a page switch instead
 * of in the same step (Nico, 2026-10-22: going Home -> Businesses on his
 * iPhone, the menu took ~2s to respond; the page's whole tree was rendered
 * and laid out in one go, and §03's story alone is ~75% of it).
 *
 * - First load (server HTML + hydration) and on the server: children render
 *   straight away, so the HTML is unchanged and nothing is missing for
 *   search engines or no-JS visitors.
 * - Arriving by a client-side page switch (this document was loaded on a
 *   different path): a same-height placeholder first, then the children in
 *   an idle moment, as a transition React can interrupt for a tap.
 * - A link with a #hash renders at once, so the browser can scroll to it.
 *
 * Keep the section's own wrapper (FlowSection, data-ground) OUTSIDE this:
 * FlowGround finds sections once, when the page mounts. Use it from a client
 * component (a server component can't import values from a "use client"
 * file: they arrive as client references, not numbers).
 */
export function DeferOnClientNav({ children, placeholderHeight }: { children: ReactNode; placeholderHeight: string }) {
  const [show, setShow] = useState(() => !arrivedByPageSwitch())

  useEffect(() => {
    if (show) return
    const reveal = () => startTransition(() => setShow(true))
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(reveal, { timeout: 1200 })
      return () => window.cancelIdleCallback(id)
    }
    const t = setTimeout(reveal, 200)
    return () => clearTimeout(t)
  }, [show])

  return show ? <>{children}</> : <div aria-hidden="true" style={{ height: placeholderHeight }} />
}

/**
 * True only when this page was reached by a client-side switch: the document
 * itself was loaded on another path. NOT "has the app mounted": with the
 * page's Suspense boundaries, parts of the first load hydrate after the nav
 * has mounted, and they must still match the server HTML.
 */
function arrivedByPageSwitch(): boolean {
  if (typeof window === "undefined" || window.location.hash) return false
  const nav = performance.getEntriesByType?.("navigation")?.[0] as PerformanceNavigationTiming | undefined
  if (!nav) return false
  try {
    return new URL(nav.name).pathname !== window.location.pathname
  } catch {
    return false
  }
}
