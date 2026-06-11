"use client"

import Image from "next/image"
import {
  m,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react"
import type { MotionValue } from "motion/react"
import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { Magnetic, PlaneFlight } from "./anim"
import { BtnPlane } from "./btn-plane"
import { APP_DOWNLOAD_URL } from "./constants"

/* ------------------------------------------------------------------ *
 * Mount entrance: short, fast fade+rise for headline / subcopy / CTA.
 * Uses initial/animate (hero is above the fold) so it plays on load,
 * independent of scroll. Kept FAST to avoid hurting perceived LCP.
 * ------------------------------------------------------------------ */
const ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const

function Entrance({
  children,
  delay = 0,
  as = "div",
  className,
  id,
}: {
  children: ReactNode
  delay?: number
  as?: "div" | "h1" | "p"
  className?: string
  id?: string
}) {
  const prefersReduced = useReducedMotion()
  const MComponent = m[as]

  if (prefersReduced) {
    const Tag = as
    return (
      <Tag className={className} id={id}>
        {children}
      </Tag>
    )
  }

  return (
    <MComponent
      className={className}
      id={id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: ENTRANCE_EASE, delay }}
    >
      {children}
    </MComponent>
  )
}

/* ------------------------------------------------------------------ *
 * Pointer parallax: a normalized pointer position (-1..1) tracked at the
 * visual layer and shared down to the phone + floating cards, each with a
 * depth multiplier (cards move more than the phone). Desktop/fine-pointer
 * only; no-ops on touch and reduced motion. matchMedia read in an effect
 * (SSR-safe — no window access during render).
 * ------------------------------------------------------------------ */
function usePointerParallax() {
  const prefersReduced = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Springy, normalized pointer offset from the visual center.
  const spring = { stiffness: 120, damping: 26, mass: 0.6 }
  const px = useSpring(0, spring)
  const py = useSpring(0, spring)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const ok =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !prefersReduced
    setEnabled(ok)
  }, [prefersReduced])

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    function onMove(event: PointerEvent) {
      const rect = el!.getBoundingClientRect()
      const nx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
      const ny = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
      px.set(Math.max(-1, Math.min(1, nx)))
      py.set(Math.max(-1, Math.min(1, ny)))
    }
    function onLeave() {
      px.set(0)
      py.set(0)
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    el.addEventListener("pointerleave", onLeave)
    return () => {
      window.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerleave", onLeave)
    }
  }, [enabled, px, py])

  return { ref, px, py, enabled }
}

/**
 * A floating card with three composed behaviours:
 *  - a "bloom" entrance: the card pops in (scale + fade) as the intro plane
 *    flies past it — `appear` is the per-card delay synced to the flight
 *  - pointer parallax (depth-scaled translation tracking the cursor)
 *  - a gentle continuous idle float (small y oscillation), with a
 *    per-card phase offset so cards don't bob in unison.
 * All no-op when parallax is disabled (touch / reduced motion); on mobile the
 * two visible cards get a CSS-only pop + bob instead (see framer-site.css).
 */
function FloatCard({
  className,
  children,
  px,
  py,
  depth,
  phase,
  appear,
  active,
}: {
  className: string
  children: ReactNode
  px: MotionValue<number>
  py: MotionValue<number>
  depth: number
  phase: number
  appear: number
  active: boolean
}) {
  // Pointer parallax: map normalized -1..1 onto pixel travel scaled by depth.
  const x = useTransform(px, (v) => v * depth)
  const y = useTransform(py, (v) => v * depth)

  if (!active) {
    return <div className={className}>{children}</div>
  }

  // The card's background/padding lives on the outer element, so every
  // whole-card move (bloom scale/opacity + parallax x/y) must happen THERE —
  // Motion composes the style motion values with the animated scale into one
  // transform. Only the gentle idle bob runs on an inner element (its y would
  // otherwise fight the parallax y).
  return (
    <m.div
      className={className}
      style={{ x, y }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 190, damping: 17, delay: appear }}
    >
      <m.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 5.5,
          ease: "easeInOut",
          repeat: Infinity,
          delay: phase,
        }}
      >
        {children}
      </m.div>
    </m.div>
  )
}

/**
 * Hand-drawn orange underline that sweeps on under the key phrase right after
 * the headline settles — drawn once, scales with the text via viewBox.
 */
function HeroUnderline() {
  const prefersReduced = useReducedMotion()
  return (
    <svg className="hero-underline-svg" viewBox="0 0 230 14" preserveAspectRatio="none" aria-hidden="true">
      {prefersReduced ? (
        <path d="M4 10 C 70 13.5, 150 3, 226 7.5" />
      ) : (
        <m.path
          d="M4 10 C 70 13.5, 150 3, 226 7.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1.05, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        />
      )}
    </svg>
  )
}

export function FramerHero() {
  const { ref, px, py, enabled } = usePointerParallax()

  // Phone tracks the pointer too, but more subtly than the cards (less depth).
  const phoneX = useTransform(px, (v) => v * 10)
  const phoneY = useTransform(py, (v) => v * 8)

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-sky" aria-hidden="true">
        <Image src="/framer-assets/hero-clouds.png" alt="" fill priority sizes="100vw" style={{ objectFit: "cover", objectPosition: "center bottom" }} />
      </div>

      <div className="hero-inner">
        <div className="hero-copy">
          <Entrance as="h1" id="hero-title" delay={0.05}>
            Stop losing money
            <br />
            to{" "}
            <span className="hero-underline">
              missing receipts.
              <HeroUnderline />
            </span>
          </Entrance>
          <Entrance as="p" className="hero-desc" delay={0.16}>
            PapeX automatically captures and organizes every transaction after purchase, so nothing gets lost, and every
            deduction is accounted for.
          </Entrance>
        </div>

        <div className="hero-visual" ref={ref}>
          <PlaneFlight delay={0.5} duration={2.6} />
          <div className="hero-phone">
            {enabled ? (
              <m.div style={{ x: phoneX, y: phoneY, width: "100%" }}>
                <Image
                  src="/framer-assets/phone-mockup.png"
                  alt="PapeX app on iPhone showing recent receipts and spending"
                  width={320}
                  height={572}
                  priority
                />
              </m.div>
            ) : (
              <Image
                src="/framer-assets/phone-mockup.png"
                alt="PapeX app on iPhone showing recent receipts and spending"
                width={320}
                height={572}
                priority
              />
            )}
          </div>

          <FloatCard
            className="hero-float hero-float--receipt hero-card-white"
            px={px}
            py={py}
            depth={26}
            phase={0}
            appear={1.05}
            active={enabled}
          >
            <div className="card-row">
              <div className="card-icon" aria-hidden="true">
                ★
              </div>
              <div>
                <div className="card-title">Receipt saved automatically</div>
                <div className="card-sub">You spent $167.24 at Walmart</div>
              </div>
            </div>
          </FloatCard>

          <FloatCard
            className="hero-float hero-float--expense hero-card-white strong"
            px={px}
            py={py}
            depth={32}
            phase={0.8}
            appear={1.25}
            active={enabled}
          >
            <div className="card-meta">August Expense Summary</div>
            <div className="card-amount">$167.24</div>
            <div className="card-detail">Across 37 receipts</div>
          </FloatCard>

          <FloatCard
            className="hero-float hero-float--tax hero-pill"
            px={px}
            py={py}
            depth={22}
            phase={1.6}
            appear={2.2}
            active={enabled}
          >
            <div className="pill-title">Tax Ready</div>
            <div className="pill-sub">Business expenses organized year-round</div>
          </FloatCard>

          <FloatCard
            className="hero-float hero-float--family hero-card-white"
            px={px}
            py={py}
            depth={28}
            phase={2.4}
            appear={2.05}
            active={enabled}
          >
            <div className="card-title">You were added to the group &quot;Smith Family&quot;</div>
            <div className="card-sub">Share receipts with Mom and 3 others</div>
          </FloatCard>

          <FloatCard
            className="hero-float hero-float--find hero-pill"
            px={px}
            py={py}
            depth={20}
            phase={3.2}
            appear={2.35}
            active={enabled}
          >
            <div className="pill-title">Find Any Receipt</div>
            <div className="pill-sub">Search by store, date, or amount</div>
          </FloatCard>
        </div>

        <Entrance className="hero-cta-wrap" delay={0.28}>
          <Magnetic>
            <a href={APP_DOWNLOAD_URL} className="btn-download" target="_blank" rel="noopener noreferrer">
              <BtnPlane />
              Download App
            </a>
          </Magnetic>
        </Entrance>
      </div>
    </section>
  )
}
