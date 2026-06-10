"use client"

import type { ReactNode } from "react"
import { LazyMotionProvider } from "./LazyMotionProvider"
import { SmoothScroll } from "./SmoothScroll"

/**
 * Single client boundary that mounts the site-wide animation providers.
 *
 * Kept intentionally thin so the server-rendered section tree passed as
 * `children` stays server-rendered — only this wrapper is a client component.
 * Neither provider blocks first paint: SmoothScroll renders native children
 * until it attaches Lenis after mount, and LazyMotion lazily loads its feature
 * bundle.
 */
export function AnimationProviders({ children }: { children: ReactNode }) {
  return (
    <SmoothScroll>
      <LazyMotionProvider>{children}</LazyMotionProvider>
    </SmoothScroll>
  )
}

export default AnimationProviders
