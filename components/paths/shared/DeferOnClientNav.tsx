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
 * - Arriving by a client-side page switch (SiteNav has already mounted, see
 *   site-nav.tsx window.__rdMenu): a same-height placeholder first, then the
 *   children in an idle moment, as a transition React can interrupt for a tap.
 * - A link with a #hash renders at once, so the browser can scroll to it.
 *
 * Keep the section's own wrapper (FlowSection, data-ground) OUTSIDE this:
 * FlowGround finds sections once, when the page mounts.
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

function arrivedByPageSwitch(): boolean {
  if (typeof window === "undefined") return false
  const pre = (window as Window & { __rdMenu?: { ready?: boolean } }).__rdMenu
  return Boolean(pre?.ready) && !window.location.hash
}
