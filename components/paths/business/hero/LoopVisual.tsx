"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { ReceiptSummary } from "@/lib/receiptSummary"
import { PhoneChrome } from "../../customer/WalkPhone"
import { ClipReceiptScreen } from "../../customer/ReceiptCard"
import { CouponsScreen, type CouponState } from "./CouponsScreen"
import { loop } from "./loop"
import s from "./hero.module.css"

/**
 * The /business hero visual — the RETURN-VISIT LOOP on one phone (Web 2.1
 * wave 3). Replaces the floating PapeX device box: Nico, 2026-09-24, "we
 * don't want to make it seem like we're a hardware company". What a merchant
 * should get from it at a glance: it isn't only receipts, it's receipts AND
 * coupons, and the point is bringing the customer back.
 *
 *   beat 1  Tap         the App Clip's rendered Tidewick Cafe receipt (the SAME
 *                       screen /customers draws: ClipReceiptScreen), a tap
 *                       ripple at the top of the phone, then "Saved"
 *   beat 2  Coupon      the app's Coupons tab; "$2 off your next visit" drops
 *                       into the list
 *   beat 3  Comes back  a second tap at the counter; the coupon reads
 *                       "Used" (no store greeting: the app has none)
 *   close               the last arc of the ring (Comes back -> Tap) lights,
 *                       closing the loop
 *
 * The three stops sit ON a ring drawn behind the phone (wide column) or in a
 * numbered row under it (narrow column) — a container query picks, so the
 * phone is always whole and never covered.
 *
 * MOTION: one pass, ~5.9s, then it holds on the final frame. It starts on
 * load where the stage is on screen (desktop), or the first time it scrolls
 * into view (phones, where it sits under the text); an IntersectionObserver
 * decides, so nothing reads layout per frame. Only
 * opacity, transform and clip-path animate; no layout is read. There is no
 * loop and no infinite animation anywhere in the hero.
 *
 * FIRST PAINT: the server renders the FINAL frame (that is also the no-JS and
 * reduced-motion picture). With motion allowed the stage starts invisible
 * (CSS, keyed on `data-mode`), rewinds to beat 1 with transitions off, and
 * fades in — so nobody sees the final frame flash and then rewind.
 */

type Phase = "receipt" | "tap" | "saved" | "coupon" | "back" | "closed"

const ORDER: Phase[] = ["receipt", "tap", "saved", "coupon", "back", "closed"]

/** When each phase starts, in ms after the stage becomes visible. */
const SCHEDULE: [Phase, number][] = [
  ["tap", 450],
  ["saved", 1500],
  ["coupon", 2150],
  ["back", 3950],
  ["closed", 5200],
]

const at = (phase: Phase, from: Phase) => ORDER.indexOf(phase) >= ORDER.indexOf(from)

export function LoopVisual({ summary, clock }: { summary: ReceiptSummary; clock: string }) {
  // Server + reduced motion + no-JS: the final frame.
  const [phase, setPhase] = useState<Phase>("closed")
  // "static" = never animates; "rewind" = beat 1 painted with transitions off
  // and the stage hidden; "idle" = beat 1 visible, waiting to be on screen;
  // "play" = running (then holding on the final frame).
  const [mode, setMode] = useState<"static" | "rewind" | "idle" | "play">("static")

  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const stage = stageRef.current
    if (!stage) return
    const timers: number[] = []
    let raf1 = 0
    let raf2 = 0
    setPhase("receipt")
    setMode("rewind")
    // The pass starts the first time the stage is mostly on screen: at once
    // on a desktop (it is above the fold), and when it is scrolled to on a
    // phone, where it sits under the text — otherwise it would finish unseen.
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        setMode("play")
        for (const [p, ms] of SCHEDULE) timers.push(window.setTimeout(() => setPhase(p), ms))
      },
      { threshold: 0.6 },
    )
    // Two frames so the rewound, transition-less beat 1 is painted before the
    // stage fades in and the transitions come back on; only then may the
    // observer start the pass.
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setMode((m) => (m === "rewind" ? "idle" : m))
        io.observe(stage)
      })
    })
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  // Which stop is current, and which are behind us.
  const current = at(phase, "back") ? 2 : at(phase, "coupon") ? 1 : 0
  const couponState: CouponState = at(phase, "back") ? "used" : at(phase, "coupon") ? "landed" : "pending"
  // Arcs: Tap->Coupon lights with beat 2, Coupon->Comes back with beat 3, and
  // Comes back->Tap last, when the loop closes.
  const arcs = [at(phase, "coupon"), at(phase, "back"), at(phase, "closed")]

  return (
    <figure className={s.visual} aria-label={loop.description}>
      <div ref={stageRef} className={s.stage} data-hero-loop="" data-mode={mode}>
        {/* --- the ring, behind the phone ------------------------------- */}
        <div className={s.ring} aria-hidden="true">
          <span className={s.track} />
          <span className={cn(s.arc, s.arc1, arcs[0] && s.arcOn)} />
          <span className={cn(s.arc, s.arc2, arcs[1] && s.arcOn)} />
          <span className={cn(s.arc, s.arc3, arcs[2] && s.arcOn)} />
          <Arrow className={cn(s.arrow, s.arrowRight, arcs[1] && s.arcOn)} />
          <Arrow className={cn(s.arrow, s.arrowLeft, arcs[2] && s.arcOn)} />
        </div>

        {/* --- the phone ------------------------------------------------ */}
        <div className={s.phone} aria-hidden="true">
          <PhoneChrome>
            <div className={cn(s.scene, s.sceneClip, !at(phase, "coupon") && s.sceneOn)}>
              <ClipReceiptScreen summary={summary} saved={at(phase, "saved")} />
            </div>
            <div className={cn(s.scene, at(phase, "coupon") && s.sceneOn)}>
              <CouponsScreen state={couponState} time={clock} />
            </div>
          </PhoneChrome>
          {/* The tap: rings from the phone's top edge, where its NFC antenna
              meets the reader. Mounted per tap so each plays exactly once. */}
          {phase === "tap" || phase === "saved" ? <TapRipple key="t1" /> : null}
          {mode !== "static" && at(phase, "back") ? <TapRipple key="t2" /> : null}
        </div>

        {/* --- the three stops, on the ring (wide column only) ---------- */}
        <ol className={s.stopsRing}>
          {loop.stops.map((stop, i) => (
            <li
              key={stop.label}
              className={cn(s.stop, s[`stop${i + 1}`], stopState(i, current, phase))}
            >
              <StopBody index={i} label={stop.label} sub={stop.sub} />
            </li>
          ))}
        </ol>
      </div>

      <figcaption className={s.foot}>
        {/* --- the same stops as a row (narrow column only) ------------- */}
        <ol className={s.stopsRow}>
          {loop.stops.map((stop, i) => (
            <li key={stop.label} className={s.rowItem}>
              <span className={cn(s.stop, s.stopInRow, stopState(i, current, phase))}>
                <StopBody index={i} label={stop.label} sub={stop.sub} />
              </span>
              {i < loop.stops.length - 1 ? (
                <span className={s.rowArrow} aria-hidden="true">
                  →
                </span>
              ) : (
                <span className={s.rowArrow} aria-hidden="true">
                  ↺
                </span>
              )}
            </li>
          ))}
        </ol>
        <span className={s.demoTag}>{loop.demoTag}</span>
      </figcaption>
    </figure>
  )
}

function stopState(i: number, current: number, phase: Phase) {
  if (i === current) return s.stopActive
  if (i < current || phase === "closed") return s.stopDone
  return s.stopAhead
}

function StopBody({ index, label, sub }: { index: number; label: string; sub: string }) {
  return (
    <>
      <span className={s.stopNum} aria-hidden="true">
        {index + 1}
      </span>
      <span className={s.stopText}>
        <span className={s.stopLabel}>{label}</span>
        <span className={s.stopSub}>{sub}</span>
      </span>
    </>
  )
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden="true">
      <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TapRipple() {
  return (
    <span className={s.ripple} aria-hidden="true">
      <span className={s.rippleRing} />
      <span className={cn(s.rippleRing, s.rippleRing2)} />
    </span>
  )
}
