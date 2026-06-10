"use client"

import { LazyMotion, domAnimation } from "motion/react"
import type { ReactNode } from "react"

/**
 * Wraps the app in Motion's LazyMotion with the `domAnimation` feature set so
 * that we can use the lightweight `m` component throughout the site (smaller
 * bundle than the full `motion` component). All `anim/*` primitives use `m`,
 * so they MUST be rendered inside this provider.
 *
 * `strict` is enabled so any accidental use of the heavy `motion` component
 * (which would defeat the bundle-size win) throws during development.
 */
export function LazyMotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  )
}

export default LazyMotionProvider
