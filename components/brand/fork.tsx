'use client'

// components/brand/fork.tsx
//
// Screen 1 — the fork. A full-viewport fixed split: dark #00121D on top,
// light #F5F5F5 below. One deliberate gesture commits to a path; the chosen
// half's flex-grow runs 1 -> 40 over 620ms cubic-bezier(.7,0,.3,1) while the
// loser collapses, and then we navigate.
//
// SURFACE AND DESTINATION ARE DECOUPLED — this is deliberate, and the reason
// the file reads positionally (top/bottom) rather than by path name.
//   * `data-surface` ("navy" | "light") owns everything you SEE: the flat
//     background, the atmosphere gradients, the plane artwork, the light-pool
//     amplitude. It is bound to POSITION and does not move.
//   * `data-side` ("customer" | "business") owns where the half GOES.
// Swapping which path lives on which half is therefore a one-line change to
// TOP_PATH / BOTTOM_PATH below — nothing else needs to move. It has been
// swapped once already (2026-09-09: down now leads to /customers), so expect
// it to move again and keep the two concerns separate.
//
// The halves DO colour-match their destination hero (since 2026-09-10): the
// navy top half leads to /business, whose hero opens on flat #00121D, and the
// light bottom half leads to /customers, whose hero opens on flat #F5F5F5.
// That continuity is what makes the commit read as the chosen half growing
// into the page instead of a page swap. The heroes get their first-paint
// colour from FlowGround's `initial` prop in components/paths/{business,
// customer}/index.tsx — if TOP_PATH / BOTTOM_PATH ever swap again, swap those
// two `initial` values (and the heroes' `ground`) with them. Do not put
// gradients on the half backgrounds — the atmosphere layers are separate
// absolutely positioned children, and the half's own `background` stays flat.
//
// Commit inputs (README "The commit interaction"):
//   wheel up   |deltaY| >= 6  -> TOP_PATH      wheel down -> BOTTOM_PATH
//   swipe      |dy|     >= 40 -> same mapping
//   click either half, or a nav link while the fork is up (FORK_COMMIT_EVENT)
// A wheelLock latch means one trackpad flick can only ever commit once.
//
// ---------------------------------------------------------------------------
// MOTION — what is locked and what is not
//
// LOCKED (styles/papex-brand.css, do not touch from here): the commit itself.
// flex-grow 1 -> 40 / 0.0001 over 620ms cubic-bezier(.7,0,.3,1); the losing
// half's content opacity .5s / transform .6s scale(.96); the seam opacity .3s;
// the hard commit at COMMIT_MS.
//
// THIS FILE OWNS everything around it: the resting depth of each half, the
// pointer-tracked light, and the paper plane's idle drift -> approach bank ->
// fly-out. All of it runs on `transform` / `opacity` only, and all of the
// continuous parts are driven from ONE rAF loop (`useEffect` below) that
// writes straight to DOM nodes — no state, no re-render, no per-element
// listener. It is cancelled on unmount and never starts at all under
// `prefers-reduced-motion: reduce`.
//
// The fly-out is a CSS transition kicked off imperatively at commit time
// (FLY_MS / FADE_MS, both < COMMIT_MS) on the plane wrappers, which are NOT
// part of the flex-grow interpolation — so it cannot delay or fight it.

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useReducedMotion } from 'motion/react'
import { PATH_HREF, setPathChoice, type PathChoice } from '@/lib/pathChoice'
import { FORK_COMMIT_EVENT } from './site-nav'
import styles from './fork.module.css'

const COMMIT_MS = 620
const WHEEL_MIN = 6
const SWIPE_MIN = 40

// Which destination each half leads to. Position and colour are fixed by the
// design (navy above the seam, light below); only this mapping moves. Swapping
// these two values swaps the fork, and nothing else in this file has to change.
const TOP_PATH: PathChoice = 'business'
const BOTTOM_PATH: PathChoice = 'customer'

// The two painted surfaces, keyed by position rather than by path — see the
// header note. 'navy' is always the top half, 'light' always the bottom.
type Surface = 'navy' | 'light'

// --- Ambience tuning --------------------------------------------------------

// Resting opacity of the plane watermark. The prototype's .05/.06 is below the
// threshold where the mark reads as anything — on a navy field it is a smudge,
// not a brand. These are the values where it reads as depth in the surface and
// still loses decisively to the headline. The light half sits lower because
// navy-on-off-white carries far more contrast per unit of alpha than
// orange-on-navy does.
const PLANE_REST_OPACITY: Record<Surface, number> = {
  navy: 0.15,
  light: 0.11,
}

// The brand plane's fixed angle — same as the nav logo's.
const PLANE_REST_ROTATION = -8

// Idle drift. Periods of 20-33s: the mark is never perfectly still, but no
// single motion ever completes inside the time a visitor spends deciding, so
// it reads as "held aloft" rather than as an animation playing.
const IDLE_X = 5.5 // px
const IDLE_Y = 7 // px
const IDLE_ROT = 1.7 // deg

// Approach: how far the plane banks toward the viewer at full scroll intent.
const APPROACH_X = 24 // px, along the nose (the artwork noses up-and-right)
const APPROACH_Y = -18 // px
const APPROACH_ROT = 4.5 // deg — levelling out of the -8deg rest bank
const APPROACH_SCALE = 0.12 // toward the viewer
const RECEDE_SCALE = 0.06 // and away again on the half being scrolled away from

// Pointer parallax depths, in px of travel per half-viewport of cursor motion.
// Three different numbers on three layers is what turns a flat field of colour
// into a lit volume: the light pool leads, the plane follows at a third of the
// distance, the haze counter-moves.
const GLOW_STRENGTH: Record<Surface, number> = { navy: 70, light: 60 }
const HAZE_FACTOR = -0.42 // of GLOW_STRENGTH, i.e. opposite and shorter
const PLANE_PARALLAX = 26

// A cursor resting in one half is itself a statement of intent, and on a mouse
// wheel there is almost no pre-commit window (|deltaY| >= 6 commits on the
// first event), so hover is where desktop visitors actually see the approach.
// Deliberately weaker than a real gesture, and capped well below 1.
const HOVER_BIAS = 0.34

const FLY_MS = 520 // winning plane leaves frame...
const FADE_MS = 380 // ...while the other recedes. Both inside COMMIT_MS.

const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value

export function Fork() {
  const router = useRouter()
  const prefersReduced = useReducedMotion()
  const [committing, setCommitting] = useState<PathChoice | null>(null)
  // Refs, not state: the latch must be readable synchronously inside the
  // wheel handler on the very next event, before React re-renders.
  const lock = useRef(false)
  const timer = useRef<number | null>(null)

  // Ambience nodes, named by POSITION (see header): top = navy, bottom =
  // light. Written to imperatively by the rAF loop.
  const topHalf = useRef<HTMLButtonElement>(null)
  const bottomHalf = useRef<HTMLButtonElement>(null)
  const topPlane = useRef<HTMLSpanElement>(null)
  const bottomPlane = useRef<HTMLSpanElement>(null)
  const topGlow = useRef<HTMLSpanElement>(null)
  const bottomGlow = useRef<HTMLSpanElement>(null)
  const topHaze = useRef<HTMLSpanElement>(null)
  const bottomHaze = useRef<HTMLSpanElement>(null)

  const raf = useRef<number | null>(null)
  // Scroll intent, -1 = all the way toward customers, +1 = toward business.
  // Same sign convention as deltaY, so wheel deltas feed it directly.
  const gesture = useRef(0)
  const touching = useRef(false)
  const pointer = useRef<{ x: number; y: number } | null>(null)

  // Winner accelerates out of frame along its nose; loser recedes. Imperative
  // rather than declarative because the exit vector needs the live viewport
  // size, and because it must land in the same tick as the commit.
  const flyOut = useCallback((winner: PathChoice) => {
    if (raf.current !== null) {
      cancelAnimationFrame(raf.current)
      raf.current = null
    }
    const won = winner === TOP_PATH ? topPlane.current : bottomPlane.current
    const lost = winner === TOP_PATH ? bottomPlane.current : topPlane.current

    if (won) {
      const dx = Math.round(window.innerWidth * 0.62)
      const dy = Math.round(window.innerHeight * 0.58)
      // ease-IN, so it reads as acceleration rather than a slide.
      won.style.transition = `transform ${FLY_MS}ms cubic-bezier(.42,0,.92,.36), opacity ${FLY_MS}ms cubic-bezier(.5,0,1,1)`
      won.style.transform = `translate3d(${dx}px, ${-dy}px, 0) rotate(-2deg) scale(1.5)`
      won.style.opacity = '0'
    }
    if (lost) {
      lost.style.transition = `transform ${FADE_MS}ms cubic-bezier(.4,0,.2,1), opacity ${FADE_MS}ms ease`
      lost.style.transform = `translate3d(0,0,0) rotate(${PLANE_REST_ROTATION - 4}deg) scale(.82)`
      lost.style.opacity = '0'
    }
  }, [])

  const commit = useCallback(
    (choice: PathChoice) => {
      if (lock.current) return
      lock.current = true
      setPathChoice(choice)

      const href = PATH_HREF[choice]
      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reduced) {
        // Skip the expansion entirely and just go.
        router.push(href)
        return
      }

      flyOut(choice)
      setCommitting(choice)
      timer.current = window.setTimeout(() => {
        window.scrollTo(0, 0)
        router.push(href)
      }, COMMIT_MS)
    },
    [router, flyOut],
  )

  // Warm both destinations so the 620ms expansion is not followed by a stall.
  useEffect(() => {
    router.prefetch(PATH_HREF.customer)
    router.prefetch(PATH_HREF.business)
  }, [router])

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (lock.current) return
      if (Math.abs(event.deltaY) < WHEEL_MIN) {
        // Below the commit threshold: this is approach, not a decision.
        gesture.current = clamp(gesture.current + event.deltaY * 0.09, -1, 1)
        return
      }
      commit(event.deltaY < 0 ? TOP_PATH : BOTTOM_PATH)
    }

    let startY = 0
    const onTouchStart = (event: TouchEvent) => {
      startY = event.touches[0].clientY
      touching.current = true
      gesture.current = 0
    }
    const onTouchMove = (event: TouchEvent) => {
      if (lock.current) return
      // 0..SWIPE_MIN of finger travel is the whole pre-commit window; map it
      // onto the full intent range so the bank is fully expressed by the time
      // the swipe actually commits.
      gesture.current = clamp(
        (startY - event.touches[0].clientY) / SWIPE_MIN,
        -1,
        1,
      )
    }
    const onTouchEnd = (event: TouchEvent) => {
      touching.current = false
      if (lock.current) return
      const dy = startY - event.changedTouches[0].clientY
      if (Math.abs(dy) < SWIPE_MIN) return
      // dy > 0 means the finger travelled UP, which scrolls the page DOWN —
      // the same direction as a positive wheel deltaY. Both therefore land on
      // BOTTOM_PATH, and the two input paths stay in agreement.
      commit(dy < 0 ? TOP_PATH : BOTTOM_PATH)
    }
    const onTouchCancel = () => {
      touching.current = false
      gesture.current = 0
    }

    const onNavCommit = (event: Event) => {
      const choice = (event as CustomEvent<PathChoice>).detail
      if (choice === 'customer' || choice === 'business') commit(choice)
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchCancel, { passive: true })
    window.addEventListener(FORK_COMMIT_EVENT, onNavCommit)

    // The fork owns the viewport; stop the page behind it from scrolling (and
    // stop iOS rubber-banding from eating the swipe).
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchCancel)
      window.removeEventListener(FORK_COMMIT_EVENT, onNavCommit)
      document.body.style.overflow = previousOverflow
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [commit])

  // --- The single rAF loop --------------------------------------------------
  // Idle drift + pointer parallax + approach bank for both halves, in one
  // callback. Never starts under reduced motion (so there is nothing to
  // "turn off" — the markup simply keeps its CSS rest transform), and is
  // cancelled on unmount and by flyOut().
  useEffect(() => {
    if (prefersReduced) return
    if (typeof window === 'undefined' || !window.matchMedia) return

    const fine = window.matchMedia('(pointer:fine)').matches

    const sides = [
      {
        surface: 'navy' as Surface,
        dir: -1, // negative intent points at this half
        phase: 0,
        half: topHalf.current,
        plane: topPlane.current,
        glow: topGlow.current,
        haze: topHaze.current,
        rect: null as DOMRect | null,
      },
      {
        surface: 'light' as Surface,
        dir: 1,
        phase: 2.3, // out of phase with the other plane; they never pulse together
        half: bottomHalf.current,
        plane: bottomPlane.current,
        glow: bottomGlow.current,
        haze: bottomHaze.current,
        rect: null as DOMRect | null,
      },
    ]

    const measure = () => {
      for (const s of sides) s.rect = s.half?.getBoundingClientRect() ?? null
    }
    measure()

    const onPointerMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY }
    }
    if (fine) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
    }
    window.addEventListener('resize', measure, { passive: true })

    // Start the smoothed cursor at the viewport centre so nothing snaps into
    // place on the first mousemove.
    let smoothX = window.innerWidth / 2
    let smoothY = window.innerHeight / 2
    let intent = 0
    let last = performance.now()
    const started = last

    const frame = (now: number) => {
      raf.current = requestAnimationFrame(frame)

      // Frame-rate independent smoothing: a 144Hz display and a struggling
      // 30fps laptop settle at the same speed in wall-clock terms.
      const dt = Math.min(48, now - last)
      last = now
      const steps = dt / 16.667
      const k = 1 - Math.pow(0.9, steps)
      const t = (now - started) / 1000

      const target = pointer.current
      if (target) {
        smoothX += (target.x - smoothX) * k
        smoothY += (target.y - smoothY) * k
      }
      const vw = window.innerWidth || 1
      const vh = window.innerHeight || 1
      const viewX = smoothX / vw - 0.5
      const viewY = smoothY / vh - 0.5

      // Scroll intent decays back to rest whenever the visitor stops pushing.
      // A finger on the glass is exempt: it holds its value until it lifts.
      if (!touching.current) {
        gesture.current *= Math.pow(0.93, steps)
        if (Math.abs(gesture.current) < 0.002) gesture.current = 0
      }
      const hover = fine && target ? clamp(viewY * 2, -1, 1) * HOVER_BIAS : 0
      intent += (clamp(gesture.current + hover, -1, 1) - intent) * k

      for (const s of sides) {
        const rect = s.rect
        if (rect && rect.width && rect.height) {
          const hx = clamp(
            (smoothX - (rect.left + rect.width / 2)) / rect.width,
            -1,
            1,
          )
          const hy = clamp(
            (smoothY - (rect.top + rect.height / 2)) / rect.height,
            -1,
            1,
          )
          const strength = GLOW_STRENGTH[s.surface]
          if (s.glow) {
            s.glow.style.transform = `translate3d(${(hx * strength).toFixed(2)}px,${(hy * strength).toFixed(2)}px,0)`
          }
          if (s.haze) {
            const hz = strength * HAZE_FACTOR
            s.haze.style.transform = `translate3d(${(hx * hz).toFixed(2)}px,${(hy * hz).toFixed(2)}px,0)`
          }
        }

        const plane = s.plane
        if (!plane) continue
        // > 0: this half is the one being scrolled toward.
        const approach = clamp(s.dir * intent, -1, 1)
        const tx =
          IDLE_X * Math.sin(t * 0.31 + s.phase) +
          viewX * PLANE_PARALLAX +
          approach * APPROACH_X
        const ty =
          IDLE_Y * Math.sin(t * 0.23 + s.phase * 1.7) +
          viewY * PLANE_PARALLAX * 0.62 +
          approach * APPROACH_Y
        const rot =
          PLANE_REST_ROTATION +
          IDLE_ROT * Math.sin(t * 0.19 + s.phase * 0.6) +
          approach * APPROACH_ROT
        const scale =
          1 + approach * (approach > 0 ? APPROACH_SCALE : RECEDE_SCALE)

        plane.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`
        plane.style.opacity = clamp(
          PLANE_REST_OPACITY[s.surface] * (1 + approach * 0.28),
          0,
          1,
        ).toFixed(3)
      }
    }

    raf.current = requestAnimationFrame(frame)

    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
      raf.current = null
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('resize', measure)
    }
  }, [prefersReduced])

  const stateFor = (side: PathChoice) =>
    committing === null ? 'idle' : committing === side ? 'won' : 'lost'

  return (
    <div
      className={`rd-fork ${styles.fork}`}
      data-committing={committing !== null}
      data-nav-theme="dark"
    >
      {/* TOP HALF — navy surface, always. Its destination is TOP_PATH. */}
      <button
        ref={topHalf}
        type="button"
        className={`rd-fork-half rd-hairlines ${styles.half}`}
        data-surface="navy"
        data-side={TOP_PATH}
        data-state={stateFor(TOP_PATH)}
        onClick={() => commit(TOP_PATH)}
        aria-label="Enter the business site"
      >
        <span ref={topGlow} className={styles.glow} aria-hidden="true" />
        <span ref={topHaze} className={styles.haze} aria-hidden="true" />
        <span className={styles.vignette} aria-hidden="true" />
        <span className={styles.grain} aria-hidden="true" />
        <span
          ref={topPlane}
          className={`${styles.planeWrap} ${styles.planeTop}`}
          style={{ opacity: PLANE_REST_OPACITY.navy }}
          aria-hidden="true"
        >
          {/* Orange body / white lines — the dark-surface variant. */}
          <Image
            src="/brand/plane-orange-white.png"
            alt=""
            width={260}
            height={260}
            priority
          />
        </span>
        {/* contentTop pushes this block below the floating nav, so it centres
            in the part of the half the visitor can see — see fork.module.css. */}
        <span className={`rd-fork-content ${styles.contentTop}`}>
          <span
            className={`rd-eyebrow rd-eyebrow-wide ${styles.eyebrow}`}
            style={{ color: 'var(--orange)' }}
          >
            For Business
          </span>
          <span
            className={`rd-display ${styles.headline} ${styles.headlineTop}`}
            style={{ color: 'var(--offwhite)' }}
          >
            Free digital receipts for your store.
          </span>
          <span
            className={`rd-fork-cue ${styles.cue}`}
            style={{ color: 'rgba(245,245,245,.62)' }}
          >
            <span className="rd-chevron rd-chevron-up" aria-hidden="true" />
            Scroll up or click to enter
          </span>
        </span>
      </button>

      {/* One centre-bright rule, plus ONE static brand line on it (Web 2.1,
          task F1, Nico round 3: "Your receipt, one tap away"). Until now
          nothing on `/` said what PapeX is. It is the page's H1 — the two
          halves are buttons, and a button can't hold a heading. The line sits
          OVER the rule (absolutely centred, so the seam stays 1px and the
          halves' 50/50 layout doesn't move) and fades with the seam's locked
          commit opacity in papex-brand.css; it has no motion of its own.
          Only the rule is aria-hidden: the heading must stay readable. */}
      <div className="rd-fork-seam">
        <div className={styles.seamRule} aria-hidden="true" />
        <h1 className={styles.seamLine}>Your receipt, one tap away</h1>
      </div>

      {/* BOTTOM HALF — light surface, always. Its destination is BOTTOM_PATH. */}
      <button
        ref={bottomHalf}
        type="button"
        className={`rd-fork-half ${styles.half}`}
        data-surface="light"
        data-side={BOTTOM_PATH}
        data-state={stateFor(BOTTOM_PATH)}
        onClick={() => commit(BOTTOM_PATH)}
        aria-label="Enter the customer site"
      >
        <span ref={bottomGlow} className={styles.glow} aria-hidden="true" />
        <span ref={bottomHaze} className={styles.haze} aria-hidden="true" />
        <span className={styles.vignette} aria-hidden="true" />
        <span className={styles.grain} aria-hidden="true" />
        <span
          ref={bottomPlane}
          className={`${styles.planeWrap} ${styles.planeBottom}`}
          style={{ opacity: PLANE_REST_OPACITY.light }}
          aria-hidden="true"
        >
          {/* Navy body / white lines. The light half already spends its orange
              on the eyebrow, the chevron and the light pool; a fourth orange
              element there competes with the accent instead of supporting it,
              and navy-on-off-white reads as depth. */}
          <Image
            src="/brand/plane-navy-white.png"
            alt=""
            width={260}
            height={260}
            priority
          />
        </span>
        <span className="rd-fork-content">
          <span
            className={`rd-eyebrow rd-eyebrow-wide ${styles.eyebrow}`}
            style={{ color: 'var(--orange)' }}
          >
            For Customers
          </span>
          <span
            className={`rd-display ${styles.headline} ${styles.headlineBottom}`}
            style={{ color: 'var(--navy)' }}
          >
            Never lose a receipt again.
          </span>
          <span className={`rd-fork-cue ${styles.cue}`} style={{ color: 'rgba(0,18,29,.55)' }}>
            <span className="rd-chevron rd-chevron-down" aria-hidden="true" />
            Scroll down or click to enter
          </span>
        </span>
      </button>
    </div>
  )
}
