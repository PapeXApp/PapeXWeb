"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { ReceiptSummary } from "@/lib/receiptSummary"
import { PhoneChrome } from "../../customer/WalkPhone"
import { ClipApp, ClipLockScreen, WalkAppScreen } from "../../customer/appui"
import { receiptMoment } from "../../customer/appui/Clip"
import { demoContent } from "../../customer/content"
import { ClipCouponLead, CouponScreen, type CouponState } from "./CouponScreen"
import { CashierBody, CashierHands, CheckGlyph, HandBack, HandFront, ScannerArm } from "./SceneArt"
import { loop } from "./loop"
import s from "./hero.module.css"

/**
 * The /business hero visual — "CLOSE THE LOOP", a slow looped story at a
 * checkout counter (P3-B1, 2026-09-25; art and guide redone in P3-B6; story
 * redone in P3-B7 to Nico's storyboard).
 *
 *   1 Tap      a hand holds the phone near the PapeX device on the counter,
 *              taps it; iOS's App Clip card pops up on the lock screen (the
 *              same mockup as /customers: appui ClipLockScreen); the view
 *              zooms into the phone and a finger presses "View"
 *   2 Receipt  the App Clip receipt opens (appui ClipApp) on the coupon for
 *              the next visit: a big coupon card ON TOP (P3-B9: ~40% of the
 *              screen, held ~1.6s), then a slow scroll down through the
 *              items to "Save to PapeX" — both get their moment
 *   3 Save     a finger presses Save ("Saved"), and the receipt is in the
 *              PapeX app (appui WalkAppScreen: Receipts, then Coupons)
 *   4 Coupon   a finger opens the coupon (the app kit's CouponDetail)
 *   5 Scan     the view zooms back out to the counter; the hand turns the
 *              phone, in depth, to the person behind it (P3-B9: the phone is
 *              a slab — its metal side shows, its glass darkens as it turns
 *              away), who reaches a handheld scanner forward OVER the counter
 *              and the PapeX device (it grows as it comes towards us, its
 *              shadow on the device); a red cone fans from its window onto
 *              the barcode: "Coupon used", a check; the hand leaves, round
 *              again
 *
 * ONE text guide (P3-B6, Nico: "too many labels"): the numbered steps under
 * the scene, with the playing step's sentence right under them. The steps
 * list IS the text for screen readers and the still frame; "Demo data" sits
 * at the end of the sentence line.
 *
 * MOTION. A timer walks TIMELINE (one cycle = CYCLE_MS, 26.8s); every beat is
 * a class/attribute change, and CSS transitions/animations do the moving —
 * transform and opacity only, nothing reads layout per frame, no rAF loop.
 * The one layout read is the receipt's scroll distance, once per cycle. It
 * runs only while the stage is on screen (IntersectionObserver) and the tab
 * is visible: on pause the timer stops and every running transition /
 * animation in the stage is paused (Element.getAnimations), and both resume
 * where they left off.
 *
 * STILL FRAME. The server render, no-JS and prefers-reduced-motion all show
 * beat 5 complete (the phone turned to the counter, the scanner reached
 * forward over the device with its beam on the barcode, the coupon stamped "Coupon used", a check) with
 * every step listed — one picture that tells the loop's end. With motion
 * allowed the stage starts hidden (CSS, keyed on `data-mode`), rewinds to
 * the empty counter with transitions off, and fades in, so the still frame
 * never flashes. The stage's box is the same size in every mode (0px jump).
 */

type Beat =
  | "still"
  | "off"
  | "enter"
  | "tap"
  | "card"
  | "zoomIn"
  | "press"
  | "clip"
  | "scroll"
  | "savePress"
  | "saved"
  | "app"
  | "coupons"
  | "couponTap"
  | "couponOpen"
  | "out"
  | "turn"
  | "raise"
  | "scan"
  | "used"
  | "leave"

/** Beat -> when it starts, in ms into the cycle. THE timeline: every other
 *  timing (transition lengths) is sized to fit inside these gaps. */
const TIMELINE: [Beat, number][] = [
  ["off", 0], // hand off stage, screens reset (transitions off)
  ["enter", 300], // the hand comes in, phone locked (1.1s)
  ["tap", 1700], // down onto the device (0.9s)
  ["card", 2600], // ripple + the App Clip card pops up
  ["zoomIn", 4100], // into the phone (1.5s)
  ["press", 5900], // a finger presses "View"
  ["clip", 6700], // the App Clip receipt opens on the big coupon: held ~1.6s
  ["scroll", 8800], // then a slow scroll down through the items (4s)
  ["savePress", 13000], // a finger presses "Save to PapeX"
  ["saved", 13500], // "Saved"
  ["app", 14300], // in the PapeX app: Receipts
  ["coupons", 15700], // the Coupons tab
  ["couponTap", 16600], // a finger opens the coupon
  ["couponOpen", 17100], // the coupon detail rises
  ["out", 19000], // back out to the counter (1.5s)
  ["turn", 20600], // the phone turns, in depth, to the person behind the counter (1.4s)
  ["raise", 22100], // they reach the scanner forward over the counter (1s)
  ["scan", 23200], // the beam fans onto the barcode, which is scanned (1.1s)
  ["used", 24300], // "Coupon used" + check
  ["leave", 25900], // hand and scanner leave (0.9s)
]
const CYCLE_MS = 26800
/** The receipt's slow scroll (beat "scroll"); fits before "savePress". */
const SCROLL_MS = 4000
/** The phone's thickness is drawn as this many copies of its silhouette
 *  stacked behind the screen (see .slabLayer). */
const SLAB_LAYERS = Array.from({ length: 12 }, (_, i) => i + 1)
const ORDER: Beat[] = TIMELINE.map(([b]) => b)
const idx = (b: Beat) => (b === "still" ? ORDER.indexOf("used") : ORDER.indexOf(b))
const from = (b: Beat, first: Beat) => idx(b) >= idx(first)
const within = (b: Beat, first: Beat, last: Beat) => idx(b) >= idx(first) && idx(b) <= idx(last)

/** Which of the five steps a beat belongs to (0-based). */
function stepOf(b: Beat): number {
  if (b === "off") return 0
  if (from(b, "turn")) return 4
  if (from(b, "coupons")) return 3
  if (from(b, "savePress")) return 2
  if (from(b, "clip")) return 1
  return 0
}

/** Where the phone (and the hand holding it) is. */
function poseOf(b: Beat): string {
  if (b === "off" || b === "leave") return "off"
  if (b === "enter") return "approach"
  if (b === "tap" || b === "card") return "tap"
  if (within(b, "zoomIn", "couponOpen")) return "zoom"
  if (b === "out") return "show"
  return "offer" // turn .. used, and the still
}

/** What the coupon screen shows. */
function couponStateOf(b: Beat): CouponState {
  if (b === "used" || b === "still" || b === "leave") return "used"
  if (b === "scan") return "scan"
  if (b === "couponOpen") return "landed"
  return "shown"
}

/** Where the scripted finger lands on the screen, in app points (393 x 852),
 *  measured from the mockups' own layout (P3-B7): the App Clip card's View
 *  pill, the clip's "Save to PapeX" capsule, the first coupon row. If those
 *  screens change, re-measure. */
const TOUCH: Partial<Record<Beat, [number, number]>> = {
  press: [317, 739],
  savePress: [166, 742],
  couponTap: [200, 226],
}

export function LoopVisual({ summary, clock }: { summary: ReceiptSummary; clock: string }) {
  // Server + reduced motion + no-JS: the still frame.
  const [beat, setBeat] = useState<Beat>("still")
  // "static" = never animates; "rewind" = the empty counter painted with
  // transitions off and the stage hidden; "run" = visible, looping or paused.
  const [mode, setMode] = useState<"static" | "rewind" | "run">("static")
  // Counts cycles, so one-shot pieces (ripple, the clip's launch banner)
  // remount (replay) each time.
  const [cycle, setCycle] = useState(0)
  // How far the receipt scrolls, measured once per cycle.
  const [scrollPx, setScrollPx] = useState(0)

  const figRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const clipRef = useRef<HTMLDivElement>(null)

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
      if (b === "scroll") {
        // The receipt is still at the top here; read its overflow once. The
        // clip's scroller is the first child of its [data-app-kit-clip] box.
        const flow = clipRef.current?.querySelector<HTMLElement>("[data-app-kit-clip] > div")
        if (flow) setScrollPx(Math.max(0, flow.scrollHeight - flow.clientHeight))
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
  const isStatic = mode === "static"
  const zoomed = pose === "zoom"
  // The cashier's scanner is up from "raise" to "used" (and in the still).
  const scannerUp = within(beat, "raise", "used")
  const beamOn = beat === "scan" || beat === "still"
  const touch = TOUCH[beat]
  const clipMounted = within(beat, "clip", "app")

  return (
    <figure ref={figRef} className={s.visual} aria-label={loop.description}>
      <div
        ref={stageRef}
        className={s.stage}
        data-hero-loop=""
        data-mode={mode}
        data-beat={beat}
        aria-hidden="true"
      >
        {/* --- the counter scene (the "world"): fades back when we zoom in -- */}
        <div className={cn(s.world, zoomed && s.worldAway)}>
          <CashierBody className={s.cashier} raised={scannerUp} />
          <div className={s.counterTop} />
          <div className={s.counterLip} />
          <div className={s.counterFront} />
          <CashierHands className={s.cashier} raised={scannerUp} />
          <div className={s.deviceShadow} />
          {/* The phone's soft shadow on the counter top: it follows the
              phone, and narrows as the phone turns edge-on to us. */}
          <span className={s.phoneShadow} data-pose={pose} />
          <div className={s.device}>
            <Image src="/product/rdh-device.svg" alt="" width={170} height={138} className={s.deviceImg} priority />
          </div>
          {/* Beat 5: the cashier reaches the handheld scanner forward over
              the counter (it comes up and towards us, its shadow on the
              device under it); its window turns green once it has read the
              coupon. */}
          <span className={cn(s.scanShadow, scannerUp && s.scanShadowOn)} />
          <ScannerArm className={cn(s.scanArm, scannerUp && s.scanArmUp)} done={beat === "used"} />
        </div>

        {/* The red beam: a cone of light from the scanner's window that fans
            out onto the phone's barcode (over the phone, which is turned
            towards it), with a brighter sheet down its middle that lands on
            the red line across the barcode (CouponScreen .scanLine). The still
            keeps it: it is the frame that says "scanned". */}
        <span className={cn(s.beam, s.beamCone, beamOn && s.beamOn)} />
        <span className={cn(s.beam, s.beamSheet, beamOn && s.beamOn)} />

        {/* The tap: rings from the device, where the phone meets it. Mounted
            per cycle so each tap plays exactly once. */}
        {beat === "card" ? <TapRipple key={cycle} /> : null}

        {/* --- the phone, in the hand --------------------------------------- */}
        {/* inert: the reused screens hold disabled buttons; none of it may
            take focus. */}
        <div className={cn(s.held, beat === "off" && s.snap)} data-pose={pose} inert>
          <HandBack className={cn(s.hand, s.handBack, zoomed && s.handAway)} />
          {/* The phone's body: its silhouette stacked back into depth, so a
              turn shows its metal side (see .held: preserve-3d). */}
          {SLAB_LAYERS.map((i) => (
            <span
              key={i}
              className={s.slabLayer}
              style={{ "--i": i, "--n": SLAB_LAYERS.length } as CSSProperties}
            />
          ))}
          <PhoneChrome islandLock={!from(beat, "clip")}>
            {/* 1: the lock screen; iOS's App Clip card pops up on the tap */}
            <div className={cn(s.layer, s.layerFade, !from(beat, "clip") && s.layerOn)}>
              <ClipLockScreen card={within(beat, "card", "press")} viewPressed={beat === "press"} moment={moment} />
            </div>
            {/* 2: the App Clip's receipt, coupon on top; scrolled by transform */}
            <div ref={clipRef} className={cn(s.layer, s.layerFade, within(beat, "clip", "saved") && s.layerOn)}>
              {clipMounted ? (
                <ClipApp
                  key={cycle}
                  summary={summary}
                  banner
                  saved={from(beat, "saved")}
                  savePressed={beat === "savePress"}
                  saveLabel={demoContent.saveLabel}
                  savedLabel={demoContent.savedLabel}
                  originalLabel={demoContent.sectionTitles.original}
                  lead={<ClipCouponLead />}
                  contentStyle={
                    {
                      transform: `translateY(${from(beat, "scroll") ? -scrollPx : 0}px)`,
                      transition: `transform ${SCROLL_MS}ms cubic-bezier(0.45, 0.05, 0.3, 1)`,
                    } as CSSProperties
                  }
                />
              ) : null}
            </div>
            {/* 3: saved into the PapeX app: Receipts, then Coupons */}
            <div className={cn(s.layer, s.layerFade, within(beat, "app", "couponOpen") && s.layerOn)}>
              {within(beat, "saved", "couponOpen") ? (
                <WalkAppScreen summary={summary} coupons={from(beat, "coupons")} time={moment.time} />
              ) : null}
            </div>
            {/* 4: the coupon, opened */}
            <div className={cn(s.layer, s.layerRise, (from(beat, "couponOpen") || isStatic) && s.layerIn)}>
              <CouponScreen state={isStatic ? "used" : couponStateOf(beat)} time={clock} />
            </div>
            {/* the scripted finger: a soft touch that presses in and lifts */}
            {touch ? (
              <span
                key={`${beat}-${cycle}`}
                className={s.touch}
                style={{ left: `calc(${touch[0]} * var(--pt))`, top: `calc(${touch[1]} * var(--pt))` }}
              />
            ) : null}
          </PhoneChrome>
          {/* Light on the glass: darker towards the edge that turns away,
              and a glint that crosses the screen as it turns. */}
          <span className={s.turnShade} />
          <span className={s.turnGlint}>
            <span className={s.turnGlintBand} />
          </span>
          <HandFront className={cn(s.hand, s.handFront, zoomed && s.handAway)} />
        </div>

        {/* Scanned: a check pops between the scanner and the phone. */}
        <span className={cn(s.okPop, (beat === "used" || beat === "still") && s.okPopOn)}>
          <CheckGlyph className={s.okGlyph} />
        </span>
      </div>

      <figcaption className={s.foot}>
        <ol className={s.steps}>
          {loop.steps.map((st, i) => (
            <li
              key={st.label}
              className={cn(
                s.step,
                i === step ? s.stepActive : isStatic || i < step ? s.stepDone : s.stepAhead,
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
        {/* The playing step, as a sentence, right under its number.
            aria-hidden: the list above says the same without changing every
            few seconds. Hidden like the stage until the loop runs. */}
        <div className={s.sayRow}>
          <p className={s.say} data-hero-loop="" data-mode={mode} aria-hidden="true">
            {loop.steps.map((st, i) => (
              <span key={st.label} className={cn(s.sayLine, i === step && s.sayOn)}>
                <strong className={s.sayLabel}>{st.label}</strong> {st.sub}
              </span>
            ))}
          </p>
          <span className={s.demoTag}>{loop.demoTag}</span>
        </div>
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
