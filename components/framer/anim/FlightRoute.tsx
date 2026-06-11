"use client"

import {
  m,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"

/**
 * "The live courier" — the page-long flight route.
 *
 * A faint dashed flight path weaves down the whole landing page BEHIND the
 * content, from the hero's visual area to a destination near the footer logo.
 * The line is the page's progress indicator (it draws itself in as you scroll
 * down and un-draws when you scroll back up), replacing the old top progress
 * bar. A paper-plane courier rides the drawn tip — but ONLY while the reader is
 * actually scrolling. When the page is idle there is no plane anywhere, just the
 * elegant dashed line.
 *
 * Design intent (from user feedback): the plane must feel genuinely dynamic —
 * it exists only in motion, follows a real curved path with true tangent
 * rotation, and faces its actual direction of travel including reverse (it flips
 * around when you scroll up). No persistent hovering, no fixed perches.
 *
 * Geometry is measured from the real DOM (sections + document height) on mount
 * and resize, so the waypoints always land in the gutters beside each heading.
 *
 * Overlay is position:absolute over <main> (full document height),
 * pointer-events:none, low z-index — content always reads above it. Renders a
 * static fully-drawn line and NO plane under reduced motion.
 */

type Geom = {
  /** viewBox width = viewport width at measure time. */
  vw: number
  /** viewBox height = full document (main) height. */
  vh: number
  /** Document-space top of <main>, for converting scrollY into route space. */
  top: number
  /** The single smooth cubic-bezier path through the waypoints. */
  d: string
  /**
   * Piecewise mapping from document position to route position: each
   * waypoint's main-local y (yStops) paired with its approximate arc fraction
   * along the path (fStops, chord-length parameterized). This is what lets
   * the drawn tip track the part of the route the reader is actually looking
   * at, instead of raw page progress.
   */
  yStops: number[]
  fStops: number[]
  /** Arc fractions (0..1) where each section waypoint sits, for wake pulses. */
  marks: number[]
  /** True when measured at mobile width (simpler, margin-hugging route). */
  mobile: boolean
}

const MOBILE_MAX = 809

/** The reader's anchor: the route tip tracks this fraction of viewport height. */
const TIP_ANCHOR = 0.55

/** Section ids/selectors whose headings we weave the route past, top → bottom. */
const SECTION_SELECTORS = ["#feature", "#integration", "#how", "#faq", ".site-footer"]

/** Artwork nose tilt — same correction as hero PlaneFlight. */
const PLANE_ART_ROT = "26deg"

/** Inner sprite transform: forward/reverse mirror × left-leg vertical mirror × art tilt. */
function planeSpriteTransform(facing: 1 | -1, tangentLeft: boolean): string {
  const parts: string[] = []
  if (facing === -1) parts.push("scaleX(-1)")
  if (tangentLeft) parts.push("scaleY(-1)")
  parts.push(`rotate(${PLANE_ART_ROT})`)
  return parts.join(" ")
}

/**
 * Build a smooth path string from a list of waypoints using a Catmull-Rom →
 * cubic-bezier conversion. This gives one continuous curve that eases through
 * every waypoint (no kinks), which is what both the dashed line and the plane's
 * offset-path ride.
 */
function buildSmoothPath(pts: { x: number; y: number }[], tension = 0.5): string {
  if (pts.length < 2) return ""
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension * 2
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension * 2
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

function measure(): Geom | null {
  if (typeof document === "undefined") return null
  const main = document.querySelector(".framer-site main") as HTMLElement | null
  if (!main) return null
  const mainRect = main.getBoundingClientRect()
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  // Document-space top of <main> = its viewport top + current scroll.
  const mainTop = mainRect.top + scrollTop
  const vw = window.innerWidth
  const vh = main.offsetHeight
  if (vw === 0 || vh === 0) return null
  const mobile = vw <= MOBILE_MAX

  // Horizontal lanes. On desktop we swing wide into the section gutters for a
  // pronounced weave; on mobile we hug narrow side margins clear of the text
  // column so the line never crosses the copy.
  const leftLane = mobile ? vw * 0.08 : vw * 0.16
  const rightLane = mobile ? vw * 0.92 : vw * 0.84
  const midLeft = mobile ? vw * 0.16 : vw * 0.3
  const midRight = mobile ? vw * 0.84 : vw * 0.7

  // Weave down the page, alternating sides near each section heading.
  const pts: { x: number; y: number }[] = []

  // The route starts BELOW the hero — a lead-in in the right gutter just above
  // the Features section. Starting inside the hero tangled the line with the
  // phone mockup and floating cards; the hero's own PlaneFlight owns that
  // space, and the route picks the journey up where it ends.
  const featureEl = document.querySelector("#feature") as HTMLElement | null
  const featureTopDoc = featureEl
    ? featureEl.getBoundingClientRect().top + scrollTop - mainTop
    : vh * 0.25
  // Clamp the lead-in below the hero visual (phone + float cards) so the line
  // never climbs back into them on tall viewports, while keeping at least a
  // short approach above the Features heading.
  const heroVisual = document.querySelector(".hero-visual") as HTMLElement | null
  const heroVisualBottom = heroVisual
    ? heroVisual.getBoundingClientRect().bottom + scrollTop - mainTop
    : 0
  const leadIn = Math.max(featureTopDoc - window.innerHeight * 0.22, heroVisualBottom + 12)
  pts.push({
    x: rightLane,
    y: Math.max(0, Math.min(leadIn, featureTopDoc - 40)),
  })

  // For each measured section, drop a waypoint slightly above its heading, in
  // the gutter, alternating sides for the weaving feel.
  const lanes = mobile
    ? [leftLane, rightLane, leftLane, rightLane, vw * 0.5]
    : [midLeft, rightLane, leftLane, midRight, vw * 0.5]

  SECTION_SELECTORS.forEach((sel, i) => {
    const el = document.querySelector(sel) as HTMLElement | null
    if (!el) return
    const r = el.getBoundingClientRect()
    const elTopDoc = r.top + scrollTop - mainTop
    // Aim a little inside the top of each section (near its heading band).
    const isFooter = sel === ".site-footer"
    const y = isFooter
      ? // Land near the footer logo/tagline — but clamped within the anchor's
        // reach at maximum scroll (docBottom − (1−TIP_ANCHOR)·viewport), so
        // the tip (and plane) actually arrive at the destination.
        Math.min(
          elTopDoc + r.height * 0.42,
          elTopDoc + r.height - window.innerHeight * (1 - TIP_ANCHOR) - 8
        )
      : elTopDoc + r.height * 0.18
    const x = lanes[i] ?? vw * 0.5
    pts.push({ x, y: Math.max(0, Math.min(vh, y)) })
  })

  const d = buildSmoothPath(pts, 0.5)

  // Chord-length parameterization: cumulative straight-line distance between
  // waypoints approximates each one's arc fraction along the smooth path
  // (close enough for a gentle Catmull-Rom weave). yStops/fStops together form
  // the scroll → route mapping; marks are the section fractions (lead-in
  // excluded) used for wake pulses.
  const cum = [0]
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y))
  }
  const total = cum[cum.length - 1] || 1
  const fStops = cum.map((c) => c / total)
  const yStops = pts.map((p) => p.y)
  const marks = fStops.slice(1)

  return { vw, vh, top: mainTop, d, yStops, fStops, marks, mobile }
}

export function FlightRoute() {
  const prefersReduced = useReducedMotion()
  const [geom, setGeom] = useState<Geom | null>(null)
  const maskId = useRef(`route-mask-${Math.random().toString(36).slice(2, 8)}`).current

  // ── Scroll + velocity plumbing ──────────────────────────────────────────
  const { scrollY } = useScroll()

  // The route no longer spans the whole document (it starts below the hero),
  // so raw page progress would draw the line too early and park the plane at
  // a fixed offset low in the viewport. Instead, map the reader's anchor
  // point (~55% down the viewport) through the measured yStops→fStops
  // geometry, so the drawn tip is always the part of the route that is
  // actually in front of the reader. The geometry lives in a ref so this
  // transform (bound once, on first render) always reads fresh measurements.
  const geomRef = useRef<Geom | null>(null)
  const tipFrac = useTransform(scrollY, (sy) => {
    const g = geomRef.current
    if (!g) return 0
    const anchor = sy + window.innerHeight * TIP_ANCHOR - g.top
    const { yStops, fStops } = g
    const last = yStops.length - 1
    if (last < 1) return 0
    if (anchor <= yStops[0]) return 0
    if (anchor >= yStops[last]) return 1
    let i = 1
    while (i < last && yStops[i] < anchor) i++
    const t = (anchor - yStops[i - 1]) / Math.max(1, yStops[i] - yStops[i - 1])
    return fStops[i - 1] + t * (fStops[i] - fStops[i - 1])
  })
  // The drawn length follows the smoothed tip so the line "draws" (and
  // "un-draws") with a little inertia rather than snapping.
  const drawn = useSpring(tipFrac, { stiffness: 120, damping: 28, mass: 0.45 })

  // Raw scroll velocity (px/s, signed) → smoothed so the gates don't jitter.
  const rawVel = useVelocity(scrollY)
  const velSmooth = useSpring(rawVel, { stiffness: 220, damping: 34, mass: 0.3 })

  // Plane opacity: in while scrolling, fading out ~0.6s after the reader stops.
  // We drive it through a spring on a 0/1 target toggled by a velocity gate with
  // an off-delay, so the fade is smooth and the linger is deliberate.
  const moveTarget = useMotionValue(0)
  const planeOpacity = useSpring(moveTarget, { stiffness: 180, damping: 30, mass: 0.5 })

  // Velocity-driven banking (a few degrees of extra rotation) + flip facing.
  // bankDeg: dive when flicking down (+vel), climb when flicking up (−vel).
  const bankDeg = useTransform(velSmooth, [-2600, 0, 2600], [-9, 0, 9], { clamp: true })

  // Facing flip: scrolling up means the plane travels backward along the path,
  // so it must turn around. We track a hysteretic direction sign in state and
  // map it to an inner scaleX; the CSS transition makes the turn quick-but-eased.
  const [facing, setFacing] = useState<1 | -1>(1)
  // offset-rotate:auto inverts the sprite on leftward legs (>90° rotation). Mirror
  // vertically in the rotated frame to keep the art upright; hysteresis avoids
  // flicker near vertical segments.
  const [tangentLeft, setTangentLeft] = useState(false)
  const idleTimer = useRef<number | null>(null)
  const pathRef = useRef<SVGPathElement>(null)

  // ── Measurement (mount + resize + late layout) ──────────────────────────
  useEffect(() => {
    if (prefersReduced) {
      // Still measure once so the static line is drawn full-length.
      const g = measure()
      if (g) {
        geomRef.current = g
        setGeom(g)
      }
      return
    }
    let raf = 0
    const remeasure = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const g = measure()
        if (g) {
          geomRef.current = g
          setGeom(g)
          // Geometry changed → re-derive the tip from the current scroll.
          scrollY.set(scrollY.get())
        }
      })
    }
    remeasure()
    // Re-measure after fonts/images settle and on viewport changes.
    const ro = new ResizeObserver(remeasure)
    const main = document.querySelector(".framer-site main")
    if (main) ro.observe(main)
    window.addEventListener("resize", remeasure)
    // A couple of delayed passes catch async section content (reveals, images).
    const t1 = window.setTimeout(remeasure, 400)
    const t2 = window.setTimeout(remeasure, 1200)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("resize", remeasure)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [prefersReduced])

  // ── Velocity gate: show the plane while scrolling, hide ~0.6s after stop ──
  const VEL_ON = 120 // px/s — start showing the plane above this speed
  const VEL_FLIP = 80 // px/s — only change facing once |vel| clears this
  const OFF_DELAY = 620 // ms — linger before fading the plane out

  useMotionValueEvent(velSmooth, "change", (v) => {
    if (prefersReduced) return
    const speed = Math.abs(v)
    // Facing flip with hysteresis: only commit a new direction when clearly
    // moving, so the plane doesn't twitch at rest.
    if (speed > VEL_FLIP) {
      const dir: 1 | -1 = v > 0 ? 1 : -1
      setFacing((prev) => (prev === dir ? prev : dir))
    }
    // Show/hide gate with an off-delay so a brief pause doesn't kill the plane.
    if (speed > VEL_ON) {
      if (idleTimer.current) {
        window.clearTimeout(idleTimer.current)
        idleTimer.current = null
      }
      moveTarget.set(1)
    } else if (idleTimer.current == null) {
      idleTimer.current = window.setTimeout(() => {
        moveTarget.set(0)
        idleTimer.current = null
      }, OFF_DELAY)
    }
  })

  useEffect(() => {
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current)
    }
  }, [])

  // ── Wake pulses at section crossings (scrolling down) ────────────────────
  // When the drawn tip crosses a section's fraction going down, brighten a
  // short segment of the route briefly as the handoff cue. We render one pulse
  // dot per mark and animate its opacity here via crossing detection.
  const [pulse, setPulse] = useState<number | null>(null)
  const lastProg = useRef(0)
  const pulseTimer = useRef<number | null>(null)
  useMotionValueEvent(drawn, "change", (p) => {
    if (prefersReduced || !geom) return
    const prev = lastProg.current
    if (p > prev) {
      for (let i = 0; i < geom.marks.length; i++) {
        const mk = geom.marks[i]
        if (prev < mk && p >= mk) {
          setPulse(i)
          if (pulseTimer.current) window.clearTimeout(pulseTimer.current)
          pulseTimer.current = window.setTimeout(() => setPulse(null), 650)
        }
      }
    }
    lastProg.current = p
  })
  useEffect(() => {
    return () => {
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current)
    }
  }, [])

  // ── Derived motion values (declared unconditionally, before any return) ──
  // Hide the plane at the very top (hero PlaneFlight owns the intro) and at the
  // very end. Combine with the velocity opacity spring multiplicatively.
  const planeOpacityGated = useTransform(
    [planeOpacity, drawn] as const,
    ([o, p]: number[]) => (p < 0.03 || p > 0.985 ? 0 : o)
  )
  // Mask reveal: a single dash of length=drawn exposed via dashoffset.
  const maskDashoffset = useTransform(drawn, (p) => 1 - p)
  // Plane position along the path as an offset-distance percentage string.
  const offsetDistance = useTransform(drawn, (p) => `${(p * 100).toFixed(3)}%`)

  const sampleTangentLeft = useCallback((p: number) => {
    const path = pathRef.current
    if (!path) return
    const len = path.getTotalLength()
    if (len === 0) return
    const pt = p * len
    const eps = Math.max(0.5, len * 0.001)
    const p0 = path.getPointAtLength(Math.max(0, pt - eps))
    const p1 = path.getPointAtLength(Math.min(len, pt + eps))
    const dx = p1.x - p0.x
    setTangentLeft((prev) => {
      if (!prev && dx < -1) return true
      if (prev && dx > 1) return false
      return prev
    })
  }, [])

  useMotionValueEvent(drawn, "change", (p) => {
    if (prefersReduced) return
    sampleTangentLeft(p)
  })

  useEffect(() => {
    if (!geom || prefersReduced) return
    sampleTangentLeft(drawn.get())
  }, [geom, prefersReduced, sampleTangentLeft, drawn])

  // Stroke dash pattern tuned to read quiet-but-legible over BOTH the light
  // sections and the navy integrations band.
  const dash = geom?.mobile ? "5 9" : "6 12"

  if (!geom) return null

  // Under reduced motion: static, fully-drawn dashed line, no plane, no mask.
  if (prefersReduced) {
    return (
      <div className="flight-route" aria-hidden="true">
        <svg
          className="flight-route-svg"
          viewBox={`0 0 ${geom.vw} ${geom.vh}`}
          preserveAspectRatio="none"
        >
          <path
            className="flight-route-line"
            d={geom.d}
            strokeDasharray={dash}
          />
        </svg>
      </div>
    )
  }

  return (
    <div className="flight-route" aria-hidden="true">
      <svg
        className="flight-route-svg"
        viewBox={`0 0 ${geom.vw} ${geom.vh}`}
        preserveAspectRatio="none"
      >
        <defs>
          {/*
            Reveal mask: the dashed visible path is STATIC (so the dashes never
            slide). Instead we reveal it through a mask whose SOLID white stroke
            grows from the start. The mask stroke uses pathLength=1 so a single
            dash of length=drawn with dashoffset=(1−drawn) exposes exactly the
            scrolled fraction of the route.
          */}
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width={geom.vw} height={geom.vh} fill="black" />
            <m.path
              d={geom.d}
              fill="none"
              stroke="white"
              strokeWidth={geom.mobile ? 10 : 14}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              strokeDasharray="1 1"
              style={{ strokeDashoffset: maskDashoffset }}
            />
          </mask>
        </defs>

        {/* Faint un-revealed ghost of the full route, so the path reads even
            before you scroll there (very low opacity). */}
        <path
          ref={pathRef}
          className="flight-route-ghost"
          d={geom.d}
          strokeDasharray={dash}
        />

        {/* The revealed dashed route, clipped by the scroll mask. */}
        <g mask={`url(#${maskId})`}>
          <path
            className="flight-route-line"
            d={geom.d}
            strokeDasharray={dash}
          />
        </g>

        {/* Wake overlay: a brighter copy of the route, masked the same way but
            faded in only for ~0.65s at a crossing — reads as the next segment
            lighting up as the courier passes. */}
        <m.g
          mask={`url(#${maskId})`}
          style={{ opacity: pulse != null ? 1 : 0 }}
          className="flight-route-wake-group"
        >
          <path
            className="flight-route-wake"
            d={geom.d}
            strokeDasharray={dash}
          />
        </m.g>
      </svg>

      {/* The courier. It rides the drawn tip via offset-path; opacity is
          velocity-gated so it only exists while the reader scrolls. */}
      <m.div
        className="flight-route-plane"
        style={{
          offsetPath: `path("${geom.d.replace(/"/g, "'")}")`,
          offsetDistance,
          offsetRotate: "auto",
          opacity: planeOpacityGated,
          // Banking is applied on the OUTER element on top of offset-rotate's
          // tangent (rotate composes additively with offset-rotate). Forward and
          // reverse use the same banking sign because bankDeg is keyed to vel.
          rotate: bankDeg,
        }}
      >
        {/*
          SPRITE ORIENTATION — four upright cases:

          • offset-rotate:auto aligns local +x with the forward path tangent.
            On leftward legs that rotation passes 90° and inverts the sprite.
            Fix: mirror vertically in the rotated frame (scaleY(-1)) whenever
            the sampled forward tangent points left (dx < 0, with hysteresis).
          • Art tilt: rotate(26deg) so the nose faces local +x (PlaneFlight uses
            the same correction).
          • Reverse travel: mirror horizontally (scaleX(-1)) so the nose faces
            local −x without going upside-down. Order: mirrors first, then tilt.

          forward + right  → rotate(26deg)
          forward + left   → scaleY(-1) rotate(26deg)
          reverse + right  → scaleX(-1) rotate(26deg)
          reverse + left   → scaleX(-1) scaleY(-1) rotate(26deg)

          Facing flip is velocity-gated (VEL_FLIP); this wrapper transitions
          ~150ms so direction changes read as banking, not popping.
        */}
        <div
          className="flight-route-plane-flip"
          style={{ transform: planeSpriteTransform(facing, tangentLeft) }}
        >
          <img src="/logos/plane.png" alt="" width={2459} height={1417} />
        </div>
      </m.div>
    </div>
  )
}

export default FlightRoute
