"use client"

import { m, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"

const FLIGHT_EASE = [0.5, 0.08, 0.3, 1] as const

type PlaneFlightProps = {
  /** Seconds before takeoff. */
  delay?: number
  /** Flight duration in seconds. */
  duration?: number
}

/**
 * Signature brand moment: the PapeX paper plane swoops once across its
 * container on mount, drawing a contrail behind it, then exits top-right and
 * the whole layer unmounts. The flight path is built from the container's
 * measured size so the same swoop works at any viewport width.
 *
 * The contrail draw (pathLength) and the plane's offsetDistance share one
 * timing, so the plane always sits exactly at the tip of the trail.
 *
 * pointer-events: none throughout; renders nothing under reduced motion.
 */
export function PlaneFlight({ delay = 0.5, duration = 2.6 }: PlaneFlightProps) {
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      setSize({ w: rect.width, h: rect.height })
    }
  }, [])

  // Tear the overlay down after the contrail has fully faded.
  useEffect(() => {
    if (!size) return
    const t = setTimeout(() => setDone(true), (delay + duration + 1.8) * 1000)
    return () => clearTimeout(t)
  }, [size, delay, duration])

  if (prefersReduced || done) return null

  let path = ""
  let planeW = 0
  if (size) {
    const { w, h } = size
    // Swoop: enter low from off-screen left, dip, climb through the middle,
    // glide, then exit off-screen top-right.
    path = `M ${-0.14 * w} ${0.68 * h} C ${0.16 * w} ${0.94 * h}, ${0.3 * w} ${0.28 * h}, ${0.52 * w} ${0.4 * h} C ${0.72 * w} ${0.51 * h}, ${0.84 * w} ${0.34 * h}, ${1.14 * w} ${-0.14 * h}`
    planeW = Math.max(48, Math.min(w * 0.085, 92))
  }

  return (
    <div ref={ref} className="plane-flight" aria-hidden="true">
      {size ? (
        <>
          <svg
            viewBox={`0 0 ${size.w} ${size.h}`}
            preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
          >
            <m.path
              d={path}
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth={3}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.85 }}
              animate={{ pathLength: 1, opacity: [0.85, 0.85, 0] }}
              transition={{
                pathLength: { delay, duration, ease: FLIGHT_EASE },
                opacity: { delay, duration: duration + 1.4, times: [0, 0.62, 1] },
              }}
            />
          </svg>
          <m.div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: planeW,
              offsetPath: `path("${path}")`,
              offsetRotate: "auto",
            }}
            initial={{ offsetDistance: "0%", opacity: 0 }}
            animate={{ offsetDistance: "100%", opacity: 1 }}
            transition={{
              offsetDistance: { delay, duration, ease: FLIGHT_EASE },
              opacity: { delay, duration: 0.35 },
            }}
          >
            {/* The artwork's nose points ~26° above horizontal; rotate it back
                so offset-rotate's tangent alignment reads correctly. */}
            <img
              src="/logos/plane.png"
              alt=""
              width={2459}
              height={1417}
              style={{ width: "100%", height: "auto", transform: "rotate(26deg)" }}
            />
          </m.div>
        </>
      ) : null}
    </div>
  )
}

export default PlaneFlight
