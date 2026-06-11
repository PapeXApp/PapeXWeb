"use client"

import {
  AnimatePresence,
  m,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react"
import { useState } from "react"

/**
 * "Fly me to the top": a floating button that appears after the reader is
 * deep in the page. On tap the brand plane launches up out of the button and
 * the page scrolls (natively, smooth) back to the top; when the top comes
 * back into range the button exits and the plane resets for the next flight.
 *
 * Renders nothing under reduced motion (browser smooth-scroll would also be
 * disabled there anyway).
 */
export function FlyToTop() {
  const prefersReduced = useReducedMotion()
  const { scrollY } = useScroll()
  const [visible, setVisible] = useState(false)
  const [launching, setLaunching] = useState(false)

  useMotionValueEvent(scrollY, "change", (v) => {
    const vis = v > 700
    setVisible(vis)
    if (!vis) setLaunching(false)
  })

  if (prefersReduced) return null

  function handleClick() {
    setLaunching(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <AnimatePresence>
      {visible ? (
        <m.button
          key="fly-top"
          type="button"
          className="fly-top"
          aria-label="Back to top"
          onClick={handleClick}
          initial={{ opacity: 0, scale: 0.7, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 12 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          <m.img
            src="/logos/plane.png"
            alt=""
            width={2459}
            height={1417}
            animate={
              launching
                ? { y: -46, x: 20, opacity: 0, scale: 0.6, rotate: -18 }
                : { y: 0, x: 0, opacity: 1, scale: 1, rotate: -18 }
            }
            transition={
              launching
                ? { duration: 0.5, ease: [0.4, 0, 0.8, 0.4] }
                : { duration: 0 }
            }
          />
        </m.button>
      ) : null}
    </AnimatePresence>
  )
}

export default FlyToTop
