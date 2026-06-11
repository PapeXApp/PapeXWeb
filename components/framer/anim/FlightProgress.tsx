"use client"

import {
  m,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react"
import { useState } from "react"

/**
 * Scroll progress as a flight path: a faint dotted track pinned to the top of
 * the viewport with an orange contrail that fills as the reader progresses.
 * The plane itself flies down in the page as the ScrollPlane companion — this
 * bar stays deliberately minimal so there's only one plane on screen.
 *
 * Fades in after the first bit of scroll. pointer-events: none; renders
 * nothing under reduced motion.
 */
export function FlightProgress() {
  const prefersReduced = useReducedMotion()
  const { scrollY, scrollYProgress } = useScroll()
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 })

  const [visible, setVisible] = useState(false)
  useMotionValueEvent(scrollY, "change", (v) => setVisible(v > 60))

  if (prefersReduced) return null

  return (
    <m.div
      className="flight-progress"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flight-progress-track" />
      <m.div className="flight-progress-fill" style={{ scaleX: smooth }} />
    </m.div>
  )
}

export default FlightProgress
