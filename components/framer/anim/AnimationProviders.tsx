"use client"

import type { ReactNode } from "react"
import { LazyMotionProvider } from "./LazyMotionProvider"
import { GlobalSpotlight } from "./GlobalSpotlight"

/**
 * Single client boundary that mounts the site-wide animation providers.
 *
 * Kept intentionally thin so the server-rendered section tree passed as
 * `children` stays server-rendered — only this wrapper is a client component.
 * LazyMotion lazily loads its feature bundle and does not block first paint.
 *
 * Scroll is fully native — no smooth-scroll/pinning library is mounted; nothing
 * here controls or hijacks the page scroll. The only motion driven from here is
 * the site-wide GlobalSpotlight, a pointer-following overlay (pointer-events:
 * none) that never affects scrolling.
 */
export function AnimationProviders({ children }: { children: ReactNode }) {
  return (
    <LazyMotionProvider>
      <GlobalSpotlight />
      {children}
    </LazyMotionProvider>
  )
}

export default AnimationProviders
