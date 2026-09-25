"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { ReceiptSummary } from "@/lib/receiptSummary"
import { PhoneChrome } from "../../customer/WalkPhone"
import { ClipReceiptScreen } from "../../customer/ReceiptCard"
import { ClipLockScreen } from "../../customer/appui"
import { receiptMoment } from "../../customer/appui/Clip"
import { CouponsScreen, type CouponState } from "./CouponsScreen"
import { Cashier, CheckGlyph, HandBack, HandFront } from "./SceneArt"
import { loop } from "./loop"
import s from "./hero.module.css"

/**
 * The /business hero visual — "CLOSE THE LOOP", a slow looped story at a
 * checkout counter (P3-B1, 2026-09-25). Replaces the one-pass ring (~5.9s,
 * then held), which Nico found too fast and unclear.
 *
 *   1 Tap             a hand brings the phone down onto the PapeX device on
 *                     the counter; a ripple; the App Clip card rises
 *   2 Receipt         the receipt opens, the view zooms into the phone and
 *                     the screen slowly scrolls down the receipt to "Saved"
 *   3 Coupon          the app's Coupons tab slides in; the coupon for the
 *                     next visit drops into the list
 *   4 They come back  the phone shrinks back into the hand, now held up to
 *                     the person behind the counter ("Next visit"): the
 *                     coupon is used; the hand leaves, and round again
 *
 * One caption above the scene says the current beat in a sentence; the four
 * numbered steps under it show where we are (and ARE the text for screen
 * readers and the still frame).
 *
 * MOTION. A timer walks TIMELINE (one cycle = CYCLE_MS, 19.6s); every beat is
 * a class/attribute change, and CSS transitions do the moving — transform and
 * opacity only, nothing reads layout per frame, no rAF loop. The one layout
 * read is the receipt's scroll distance, once per cycle. It runs only while
 * the stage is on screen (IntersectionObserver) and the tab is visible: on
 * pause the timer stops and every running transition/animation in the stage
 * is paused (Element.getAnimations), and both resume where they left off.
 *
 * STILL FRAME. The server render, no-JS and prefers-reduced-motion all show
 * beat 4 complete (the coupon shown at the counter, used) with all four steps
 * listed — one picture that tells the whole loop. With motion allowed the
 * stage starts hidden (CSS, keyed on `data-mode`), rewinds to the empty
 * counter with transitions off, and fades in, so the still frame never
 * flashes. The stage's box is the same size in every mode (0px jump).
 */

type Beat =
  | "still"
  | "off"
  | "enter"
  | "tap"
  | "card"
  | "receipt"
  | "zoom"
  | "scroll"
  | "saved"
  | "coupon"
  | "landed"
  | "back"
  | "used"
  | "leave"

/** Beat -> when it starts, in ms into the cycle. */
const TIMELINE: [Beat, number][] = [
  ["off", 0], // hand off stage, screens reset (transitions off)
  ["enter", 300], // the hand comes in, phone locked (1.1s)
  ["tap", 1900], // down onto the device (0.9s)
  ["card", 2800], // ripple + the App Clip card rises
  ["receipt", 4100], // the receipt opens in the hand
  ["zoom", 4900], // into the phone (1.5s)
  ["scroll", 6600], // slow scroll down the receipt (3.8s)
  ["saved", 10500], // "Saved"
  ["coupon", 11200], // the Coupons tab slides in (0.8s)
  ["landed", 12000], // the coupon drops into the list
  ["back", 14800], // out again, held up at the counter (1.5s)
  ["used", 16500], // the coupon is used at the counter
  ["leave", 18600], // the hand leaves (0.9s)
]
const CYCLE_MS = 19600

const ORDER: Beat[] = TIMELINE.map(([b]) => b)
const idx = (b: Beat) => (b === "still" ? ORDER.indexOf("used") : ORDER.indexOf(b))
const from = (b: Beat, first: Beat) => idx(b) >= idx(first)
const within = (b: Beat, first: Beat, last: Beat) => idx(b) >= idx(first) && idx(b) <= idx(last)

/** Which of the four steps a beat belongs to (0-based). */
function stepOf(b: Beat): number {
  if (b === "off") return 0
  if (from(b, "back")) return 3
  if (from(b, "coupon")) return 2
  if (from(b, "receipt")) return 1
  return 0
}

/** Where the phone (and the hand holding it) is. */
function poseOf(b: Beat): string {
  switch (b) {
    case "off":
    case "leave":
      return "off"
    case "enter":
      return "approach"
    case "tap":
    case "card":
    case "receipt":
      return "tap"
    case "zoom":
    case "scroll":
    case "saved":
    case "coupon":
    case "landed":
      return "zoom"
    case "used":
    case "still":
      return "give"
    default:
      return "show"
  }
}

export function LoopVisual({ summary, clock }: { summary: ReceiptSummary; clock: string }) {
  // Server + reduced motion + no-JS: the still frame.
  const [beat, setBeat] = useState<Beat>("still")
  // "static" = never animates; "rewind" = the empty counter painted with
  // transitions off and the stage hidden; "run" = visible, looping or paused.
  const [mode, setMode] = useState<"static" | "rewind" | "run">("static")
  // Counts cycles, so the one-shot tap ripple remounts (replays) each time.
  const [cycle, setCycle] = useState(0)
  // How far the receipt scrolls, measured once per cycle.
  const [scrollPx, setScrollPx] = useState(0)

  const figRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const stage = stageRef.current
    const fig = figRef.current
    if (!stage || !fig) return

    let timer = 0
    let raf1 = 0
    let raf2 = 0
    let next = 1 // index into TIMELINE of the beat that fires next
    let dueAt = 0 // performance.now() at which it fires
    let remaining = TIMELINE[1][1] // ms left on the pending beat while paused
    let started = false
    let running = false
    let onScreen = false

    const fire = () => {
      const [b] = TIMELINE[next]
      if (b === "off") setCycle((c) => c + 1)
      if (b === "receipt") {
        // The receipt is at the top (not scrolled) here; read its overflow once.
        const el = receiptRef.current?.querySelector<HTMLElement>(`.${s.recScroll}`)
        if (el) setScrollPx(Math.max(0, el.scrollHeight - el.clientHeight))
      }
      setBeat(b)
      const at = TIMELINE[next][1]
      next = (next + 1) % TIMELINE.length
      const nextAt = next === 0 ? CYCLE_MS : TIMELINE[next][1]
      arm(nextAt - at)
    }
    const arm = (ms: number) => {
      window.clearTimeout(timer)
      dueAt = performance.now() + ms
      timer = window.setTimeout(fire, ms)
    }
    const animations = () =>
      typeof fig.getAnimations === "function" ? fig.getAnimations({ subtree: true }) : []

    const pause = () => {
      if (!running) return
      running = false
      window.clearTimeout(timer)
      remaining = Math.max(0, dueAt - performance.now())
      animations().forEach((a) => a.pause())
    }
    const resume = () => {
      if (running || !started || !onScreen || document.hidden) return
      running = true
      animations().forEach((a) => {
        if (a.playState === "paused") a.play()
      })
      arm(remaining)
    }

    // Start (and restart after a pause) only while the stage is on screen.
    // The first pass waits until it is mostly in view, so on a phone, where
    // it sits under the text, it starts at beat 1 when it is scrolled to.
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1]
        onScreen = e.isIntersecting
        if (!started && e.intersectionRatio >= 0.5) started = true
        if (onScreen) resume()
        else pause()
      },
      { threshold: [0, 0.5] },
    )
    const onVisibility = () => (document.hidden ? pause() : resume())

    setBeat("off")
    setMode("rewind")
    // Two frames so the rewound, transition-less empty counter is painted
    // before the stage fades in and transitions come back on.
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setMode("run")
        io.observe(stage)
        document.addEventListener("visibilitychange", onVisibility)
      })
    })
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      window.clearTimeout(timer)
    }
  }, [])

  const step = stepOf(beat)
  const pose = poseOf(beat)
  const moment = receiptMoment(summary.dateline)
  const couponState: CouponState = from(beat, "used") ? "used" : from(beat, "landed") ? "landed" : "pending"
  const isStatic = mode === "static"

  return (
    <figure ref={figRef} className={s.visual} aria-label={loop.description}>
      {/* The current beat, as a sentence. aria-hidden: the steps list below
          says the same thing without changing every few seconds. */}
      <div className={s.caption} data-hero-loop="" data-mode={mode} aria-hidden="true">
        {loop.steps.map((st, i) => (
          <p key={st.label} className={cn(s.capLine, i === step && s.capOn)}>
            <span className={s.capNum}>{i + 1}</span>
            <span className={s.capText}>
              <strong className={s.capLabel}>{st.label}</strong> {st.sub}
            </span>
          </p>
        ))}
      </div>

      <div
        ref={stageRef}
        className={s.stage}
        data-hero-loop=""
        data-mode={mode}
        data-beat={beat}
        aria-hidden="true"
      >
        {/* --- the counter scene (the "world"): fades back when we zoom in -- */}
        <div className={cn(s.world, pose === "zoom" && s.worldAway)}>
          <Cashier className={s.cashier} />
          <div className={s.counterTop} />
          <div className={s.counterFront} />
          <div className={s.device}>
            <Image src="/product/rdh-device.svg" alt="" width={170} height={138} className={s.deviceImg} priority />
          </div>
        </div>

        {/* The tap: rings from the device, where the phone meets it. Mounted
            per cycle so each tap plays exactly once. */}
        {beat === "card" || beat === "receipt" ? <TapRipple key={cycle} /> : null}

        {/* --- the phone, in the hand --------------------------------------- */}
        {/* inert: the reused clip screen holds a disabled button and the
            receipt a <summary>; none of it may take focus. */}
        <div
          ref={receiptRef}
          className={cn(s.held, beat === "off" && s.snap)}
          data-pose={pose}
          inert
        >
          <HandBack className={cn(s.hand, s.handBack, pose === "zoom" && s.handAway)} />
          <PhoneChrome islandLock={!from(beat, "receipt")}>
            {/* 1: the lock screen; the App Clip card rises on the tap */}
            <div className={s.layer}>
              <ClipLockScreen card={within(beat, "card", "zoom")} moment={moment} />
            </div>
            {/* 2: the clip's receipt, scrolled by transform (not scrollTop) */}
            <div
              className={cn(s.layer, s.layerFade, from(beat, "receipt") && s.layerOn)}
              style={{ ["--rs" as string]: `${beat === "scroll" || beat === "saved" || beat === "coupon" || beat === "landed" ? scrollPx : 0}px` }}
            >
              <ClipReceiptScreen summary={summary} saved={from(beat, "saved") && beat !== "still"} className={s.recScroll} />
            </div>
            {/* 3: the app's Coupons tab, sliding in over it */}
            <div className={cn(s.layer, s.layerSlide, (from(beat, "coupon") || isStatic) && s.layerIn)}>
              <CouponsScreen state={isStatic ? "used" : couponState} time={clock} />
            </div>
          </PhoneChrome>
          <HandFront className={cn(s.hand, s.handFront, pose === "zoom" && s.handAway)} />
        </div>

        {/* --- beat 4: the time jump, and the counter's confirmation -------- */}
        <span className={cn(s.nextVisit, (within(beat, "back", "used") || isStatic) && s.popOn)}>
          {loop.nextVisit}
        </span>
        <span className={cn(s.applied, (beat === "used" || isStatic) && s.popOn)}>
          <CheckGlyph className={s.appliedGlyph} />
          {loop.applied}
        </span>
      </div>

      <figcaption className={s.foot}>
        <ol className={s.steps}>
          {loop.steps.map((st, i) => (
            <li
              key={st.label}
              className={cn(
                s.step,
                isStatic ? s.stepDone : i === step ? s.stepActive : i < step ? s.stepDone : s.stepAhead,
              )}
            >
              <span className={s.stepNum} aria-hidden="true">
                {i + 1}
              </span>
              <span className={s.stepLabel}>
                {st.label}
                <span className="sr-only"> {st.sub}</span>
              </span>
            </li>
          ))}
          <li className={s.stepLoop} aria-hidden="true">
            ↺
          </li>
        </ol>
        <span className={s.demoTag}>{loop.demoTag}</span>
      </figcaption>
    </figure>
  )
}

function TapRipple() {
  return (
    <span className={s.ripple} aria-hidden="true">
      <span className={s.rippleRing} />
      <span className={cn(s.rippleRing, s.rippleRing2)} />
      <span className={cn(s.rippleRing, s.rippleRing3)} />
    </span>
  )
}
