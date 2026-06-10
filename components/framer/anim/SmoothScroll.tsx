"use client"

import { ReactLenis } from "lenis/react"
import { useEffect, useState } from "react"
import type { ReactNode } from "react"

/**
 * Desktop-only smooth scroll provider built on Lenis.
 *
 * Lenis is enabled ONLY when ALL of the following hold:
 *   - the user does NOT prefer reduced motion
 *   - the primary pointer is fine (not a coarse/touch pointer)
 *   - the viewport is at least 1024px wide
 *
 * On mobile / touch / reduced-motion the children render untouched with native
 * scroll. The matchMedia checks run in an effect so SSR never touches `window`
 * (no hydration mismatch, no SSR crash). First paint always uses native scroll;
 * Lenis attaches after mount on qualifying devices.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return

    const query = window.matchMedia(
      "(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
    )

    const update = () => setEnabled(query.matches)
    update()

    // Re-evaluate if the environment changes (resize, plugged-in mouse, etc).
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  if (!enabled) {
    return <>{children}</>
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  )
}

export default SmoothScroll
