"use client"

import { useEffect, useRef, useState } from "react"
import { MousePointerClick } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlaneMark } from "@/components/brand/plane-mark"
import { ClipLockScreen, ClipReading } from "../../customer/appui"
import { receiptMoment } from "../../customer/appui/Clip"
import { PhoneChrome } from "../../customer/WalkPhone"
import { DashboardColumns, DashboardCopy } from "../DashboardPreview"
import { MarqueeBand } from "../MarqueeBand"
import { story } from "../story"
import { Bin, DeviceArt, Printer } from "./Furniture"
import { FitFrame } from "./merchant/FitFrame"
import { MerchantDemo } from "./merchant/MerchantDemo"
import { ClipScreen } from "./PhoneKit"
import { PhoneApp } from "./PhoneApp"
import {
  FOLD_VECS,
  HALF_REGION,
  POLY_N,
  ROUNDS,
  V_CREASE,
  V_POLY,
  V_SHADE,
  clamp01,
  ease,
  lineQuad,
  poly,
  seg,
} from "./fold"
import { useDemoReceipt } from "./receipt"
import { SlipBody } from "./Slip"
import { StaticStory } from "./StaticStory"
import s from "../story.module.css"

/**
 * "Tap to Retain" — one receipt followed from paper to phone to dashboard,
 * driven entirely by scroll (Web 2.1 B5, Nico's storyboard, 2026-09-24).
 *
 * The section is a tall runway with a `position: sticky` 100svh pin. ONE
 * progress value `p` (0..1 over the runway's scroll) drives every beat, and
 * every beat is a pure function of `p`, so scrolling up runs it backwards and
 * any `p` always draws the same frame (no timers, no accumulated state):
 *
 *   0.00-0.09  PRINT    the slip feeds down out of a centred printer
 *   0.09-0.27  TRASH    rig shifts left + bin in; the slip folds into the
 *                       PapeX plane (3D flaps, fold.ts) and flies into the bin
 *   0.27-0.41  MERGE    printer and bin glide together into one slab, the
 *                       slab settles into the PapeX device, and an iPhone
 *                       rises in front of it (lock screen, "Tap to get...")
 *   0.42-0.55  TAP      the phone bows onto the device, NFC rings go out,
 *                       the App Clip card, "Reading your receipt", then the
 *                       receipt itself — the /customers App Clip kit
 *   0.56-0.73  SPARK    phone + device slide RIGHT, the laptop appears on the
 *                       LEFT (Nico, via the lead); a spark runs from the phone
 *                       to the laptop and its lid opens. On phones (<=820px)
 *                       there is no laptop: the pair shrinks, whole, into the
 *                       top-right corner, the spark runs down to the lower
 *                       left, and the DASHBOARD PHONE (the real mobile layout)
 *                       blooms open from where it lands (a clip-path circle),
 *                       covering the stage while the pair fades under it.
 *   0.72-0.80  DELIVER  the sale lands on the dashboard: its row slides into
 *                       the top of Transactions and the count ticks up
 *   0.80-0.90  HOLD     nothing moves: laptop (phone dashboard on phones) and
 *                       the customer's phone are USABLE here, full size; the
 *                       caption fades from 0.86 and the story latches open.
 *                       (P3-B2: the old VALUE act — the row docking to the top
 *                       of the pin with the dashboard heading rising under it —
 *                       is gone. The pin's last frame is the screens alone;
 *                       the heading, lead and columns follow in flow.)
 *
 * THE CAMERA (P3-B2, Nico: "the printer is too small initially... a ton of
 * blank space"). Every act above is laid out in the stage exactly as before;
 * a `.cam` layer between the stage and its pieces adds one scale + translate
 * keyed to `p`, framing what is on screen at each beat into the pin's free
 * area (under the nav, above the caption): printer + slip large for the
 * print, eased out as the bin, then the device + phone, then the laptop
 * arrive, ending on the laptop + phone + device, whole and centred, as large
 * as the viewport allows. The frames are measured boxes (measure()), so the
 * camera never reads layout per frame either. Off on phones (<=820px), where
 * the 1:2 stage already fills the pin.
 *
 * The dashboard is the real one (merchant/MerchantDemo.tsx: app/merchant's
 * own primitives, demo data by props), the customer's phone is the code-
 * sourced app kit (PhoneKit.tsx; usable at rest: PhoneApp.tsx, "Try it"
 * pills over both screens). The dashboard's explanation (three
 * columns) sits AFTER the runway, in flow, so nothing overflows the pin.
 *
 * Server render (Web 2.1 W3, same pattern as intro/IntroScene): the HTML
 * carries BOTH this runway and the static story, and CSS picks one by
 * prefers-reduced-motion, so the section is its final height before JS and
 * never jumps at hydration (deep links like #setup land true). After mount,
 * JS drops the one CSS hid.
 *
 * Phones (B6, Nico: "I want to see a full phone... we have a lot of blank
 * space, use it well"): the stage is a 1:2 box as tall as the pin allows under
 * the nav, and the tap pose's iPhone is ~80% of its height, never cropped,
 * with the PapeX device fully in view under its lower right.
 *
 * Perf contract: the rAF frame WRITES only `transform`, `opacity` and
 * `clip-path`, and READS nothing from layout. Every geometric number (sizes,
 * the flight target, the converge targets, the spark path, the dock) is
 * measured once in `measure()`, which runs on mount and on ResizeObserver.
 * That is also what retires the 2026-09-22 flight quirk: the plane used to
 * read the rig's shift with getBoundingClientRect before the frame had
 * written it, so after a big scroll jump it aimed from a stale spot. Here the
 * shift is a measured constant, so the flight is right on the first frame.
 */

/**
 * The story's p runs 0..P_END over the scroll. P_END < 1 drops the tail of
 * the old VALUE act (the dock), keeping the same scroll speed for every beat
 * (320vh per unit of p, as before): the acts land where they always did.
 */
const P_END = 0.9
/** Scroll budget in viewport heights for the story itself (0..P_END). */
const SCROLL_VH = Math.round(320 * P_END)
/**
 * After the story ends, the open laptop + dashboard stay pinned for this much
 * more scroll before the page releases them and scrolls on (round 2: "the
 * dashboard will stay open").
 */
const DWELL_VH = 20
/** The runway: the pinned viewport, the story, then the dwell. */
const RUNWAY_VH = 100 + SCROLL_VH + DWELL_VH
/**
 * HYSTERESIS. Once the story has fully opened it LATCHES: a small scroll up,
 * or scrolling inside the dashboard, changes nothing. Only after scrolling up
 * this far past the point where it latched does it let go, and from there
 * the story is scroll-linked again, closing in reverse. One constant, in vh.
 */
const REVERSE_VH = 28
/** The laptop dashboard's virtual screen (its own px), scaled to the lid. */
const DASH_W = 960
const DASH_H = 600
/** Easing time-constant for the catch-up across a latch change (ms). */
const CATCH_TAU_MS = 110

/** Beat boundaries on the overall progress `p`. */
const T = {
  // act 1 — paper (reads its own q = p / ACT1)
  act1: 0.27,
  // act 2 — the merge into device + phone
  convA: 0.27,
  convB: 0.32,
  mrgA: 0.305,
  mrgB: 0.34,
  devA: 0.33,
  devB: 0.37,
  phoneA: 0.35,
  phoneB: 0.41,
  // the tap
  bowA: 0.42,
  bowB: 0.455,
  ringsA: 0.44,
  upA: 0.47,
  upB: 0.505,
  cardA: 0.455,
  cardB: 0.475,
  readA: 0.495,
  readB: 0.515,
  rcptA: 0.525,
  rcptB: 0.55,
  // the spark
  slideA: 0.56,
  slideB: 0.61,
  sparkA: 0.61,
  sparkB: 0.68,
  openA: 0.665,
  openB: 0.73,
  // delivery onto the dashboard, then the usable hold (fillB..dockA)
  fillA: 0.72,
  fillB: 0.8,
  // the settle: the caption fades, the story latches open
  dockA: 0.86,
} as const

/** Act 1's own clock (fractions of 0..T.act1), the old scene's beats, compressed. */
const Q = {
  printEnd: 0.333,
  shiftA: 0.333,
  shiftB: 0.444,
  foldA: 0.444,
  foldB: 0.778,
  planeEnd: 0.889,
  lid: 0.96,
  // fold rounds, as fractions of the fold window
  rCorners: 0.34,
  rEdges: 0.68,
} as const

/** Spark dots and how many of them the trail spans. */
const SPARK_N = 40
const SPARK_TRAIL = 11

type Phase = "idle" | "print" | "trash" | "landed" | "merge" | "tap" | "receipt" | "spark" | "dash" | "info"

const HINT: Record<Phase, string> = {
  idle: story.beats.print,
  print: story.beats.print,
  trash: story.beats.trash,
  landed: story.beats.trash,
  merge: story.beats.merge,
  tap: story.beats.tap,
  receipt: story.beats.receipt,
  spark: story.beats.spark,
  dash: story.beats.dash,
  info: story.beats.dash,
}

type Fill = { el: HTMLElement; key: number; kind: string }
/**
 * One camera frame: the stage point (x, y) to centre, at zoom s, placed at
 * the free area's centre (rx, ry) — all in stage px.
 */
type Cam = { x: number; y: number; s: number; rx: number; ry: number }
/** A box in stage px (layout, no transforms). */
type Box = { x: number; y: number; w: number; h: number }
/** The camera's free area in stage px, and the pin's size (px). */
type Region = Box & { pinH: number; pinW: number }

const union = (...bs: Box[]): Box => {
  const x0 = Math.min(...bs.map((b) => b.x))
  const y0 = Math.min(...bs.map((b) => b.y))
  return { x: x0, y: y0, w: Math.max(...bs.map((b) => b.x + b.w)) - x0, h: Math.max(...bs.map((b) => b.y + b.h)) - y0 }
}
const shiftBox = (b: Box, dx: number, dy = 0): Box => ({ ...b, x: b.x + dx, y: b.y + dy })
/**
 * The frame that shows `b` centred in the free area at `fill` of it; `maxH`
 * caps the box's on-screen height as a share of the pin's.
 */
const fit = (R: Region, b: Box, fill: number, maxH = 1): Cam => ({
  x: b.x + b.w / 2,
  y: b.y + b.h / 2,
  s: Math.min((R.w * fill) / b.w, (R.h * fill) / b.h, (R.pinH * maxH) / b.h),
  rx: R.x + R.w / 2,
  ry: R.y + R.h / 2,
})
/** The tap frame's share of the free area. */
const TAP_FILL = 0.96

/**
 * "Try it", over a screen that is usable (the hold, or latched open): a small
 * pill that fades in with `live`. Decorative; the screens name themselves.
 */
function TryIt({ on, className }: { on: boolean; className: string }) {
  return (
    <span className={cn(s.tryIt, className, on && s.tryOn)} aria-hidden="true">
      <MousePointerClick className={s.tryIcon} strokeWidth={2} />
      {story.tryIt}
    </span>
  )
}

/** Offset of `el` inside `root`, from layout boxes (transforms don't count). */
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = 0
  let y = 0
  let n: HTMLElement | null = el
  while (n && n !== root) {
    x += n.offsetLeft
    y += n.offsetTop
    n = n.offsetParent as HTMLElement | null
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

export function RetainStory() {
  // "ssr": server render + first client frame carry BOTH versions and CSS
  // shows one (story.module.css .runway / .staticSlot). After mount JS keeps
  // only the one CSS is showing.
  const [mode, setMode] = useState<"ssr" | "scene" | "static">("ssr")
  const pinned = mode === "scene"
  const [phase, setPhase] = useState<Phase>("idle")
  // true while the scene is at rest (the hold, or latched open): usable
  const [live, setLive] = useState(false)
  // phones: the customer's phone has faded under the dashboard phone, so
  // only the dashboard is usable there
  const [phoneDash, setPhoneDash] = useState(false)
  // bumped when the story runs back into the delivery: screens reset
  const [reset, setReset] = useState(0)
  const summary = useDemoReceipt()
  const moment = receiptMoment(summary.dateline)

  const runwayRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const groundRef = useRef<HTMLSpanElement>(null)
  const rigRef = useRef<HTMLDivElement>(null)
  const printerRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLSpanElement>(null)
  const foldRef = useRef<HTMLDivElement>(null)
  const inkRef = useRef<HTMLDivElement>(null)
  const planeRef = useRef<HTMLSpanElement>(null)
  const binRef = useRef<HTMLDivElement>(null)
  const creaseRefs = useRef<(HTMLSpanElement | null)[]>([])
  const shadeRefs = useRef<(HTMLSpanElement | null)[]>([])
  const flapRefs = useRef<(HTMLDivElement | null)[]>([])
  const flapFaceRefs = useRef<(HTMLDivElement | null)[]>([])
  const flapShadeRefs = useRef<(HTMLSpanElement | null)[]>([])
  const halfRef = useRef<HTMLDivElement>(null)
  const halfFaceRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<HTMLDivElement>(null)
  const slabRef = useRef<HTMLSpanElement>(null)
  const deviceRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLSpanElement>(null)
  const ringRefs = useRef<(HTMLSpanElement | null)[]>([])
  const phoneRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const readRef = useRef<HTMLDivElement>(null)
  const rcptRef = useRef<HTMLDivElement>(null)
  const laptopRef = useRef<HTMLDivElement>(null)
  const cardDashRef = useRef<HTMLDivElement>(null)
  const lidRef = useRef<HTMLDivElement>(null)
  const deckRef = useRef<HTMLDivElement>(null)
  const dimRef = useRef<HTMLSpanElement>(null)
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([])
  const headRef = useRef<HTMLSpanElement>(null)
  const burstRef = useRef<HTMLSpanElement>(null)
  const launchRef = useRef<HTMLSpanElement>(null)
  const hintRef = useRef<HTMLParagraphElement>(null)
  const camRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => setMode(mq.matches ? "static" : "scene")
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  useEffect(() => {
    if (!pinned) return
    const stage = stageRef.current
    const pin = pinRef.current
    const laptop = laptopRef.current
    if (!stage || !pin || !laptop) return

    // Collected ONCE: the dashboard's pieces that receive the delivered sale,
    // for both drawings of it (the laptop's, and the phone card that
    // replaces it at <=820px; CSS shows one, the frame drives that one).
    const collect = (root: HTMLElement | null) => ({
      fills: Array.from(root?.querySelectorAll<HTMLElement>("[data-fill]") ?? []).map(
        (el): Fill => ({
          el,
          key: Number(el.dataset.fill),
          kind: el.dataset.kind ?? "fade",
        }),
      ),
      empties: Array.from(root?.querySelectorAll<HTMLElement>("[data-empty]") ?? []).map((el) => ({
        el,
        key: Number(el.dataset.empty),
      })),
    })
    const { fills: fillsLap, empties: emptiesLap } = collect(laptop)
    const { fills: fillsCard, empties: emptiesCard } = collect(cardDashRef.current)
    const fillKeys = Math.max(1, ...[...fillsLap, ...fillsCard].map((f) => f.key + 1))

    /** Everything the frame needs, in px. Rebuilt by measure() only. */
    const M = {
      cq: 1,
      paperW: 1,
      foldH: 1,
      rigShift: 0,
      flyDx: 0,
      flyDy: 0,
      binW: 0,
      prDx: 0,
      prDy: 0,
      bnDx: 0,
      bnDy: 0,
      postX: 0,
      postY: 0,
      postS: 1,
      /** <=820px: the phone dashboard card replaces the laptop */
      phoneDash: false,
      /** the tap's tilt, degrees (smaller on phones: the phone is taller) */
      bowRot: 7,
      /** phone card bloom: centre (card px) and full radius */
      bloomX: 0,
      bloomY: 0,
      bloomR: 0,
      phoneH: 0,
      bowX: 0,
      bowY: 0,
      lapIn: 0,
      path: [] as number[], // x,y pairs of the spark path, stage px
      /** the camera's four frames (see Cam), stage px; empty = camera off */
      cams: [] as Cam[],
      /** the free area, and the tap pose's phone + device boxes (stage px) */
      region: null as Region | null,
      /**
       * the last frame's free area: the caption has faded by then, so it runs
       * down to --cam-final-foot above the pin's bottom (stage px)
       */
      finalRegion: null as Region | null,
      phoneBox: { x: 0, y: 0, w: 0, h: 0 } as Box,
      devBox: { x: 0, y: 0, w: 0, h: 0 } as Box,
      /** the final frame's pieces: laptop box, the pair's post-slide boxes */
      lapBox: { x: 0, y: 0, w: 0, h: 0 } as Box,
      finalPair: [] as Box[],
      finalFill: 0.94,
      /** the print frame's pieces: printer, full slip, and its two caps */
      printerBox: { x: 0, y: 0, w: 0, h: 0 } as Box,
      slipBox: { x: 0, y: 0, w: 0, h: 0 } as Box,
      printW: 0.42,
      printH: 0.7,
      /** the lid's height and the laptop's perspective (px), for its bulge */
      lidH: 0,
      persp: 1400,
      runTop: 0,
      runTotal: 0,
    }

    /**
     * The last frame, for a lid `open` 0..1. While the lid swings up its near
     * edge comes toward the viewer and the laptop's perspective widens it
     * (most when flat), so the frame makes room for that bulge — and for the
     * deck, 108% of the laptop — then settles in as the lid stands up.
     */
    const finalFrame = (open: number): Cam => {
      const R = M.finalRegion as Region
      const L = M.lapBox
      const z = M.lidH * Math.cos((Math.PI / 2) * open)
      const m = M.persp > z ? M.persp / (M.persp - z) : 1
      const grow = Math.max(0.04 * L.w, (L.w / 2) * (m - 1))
      const b = union({ ...L, x: L.x - grow, w: L.w + 2 * grow }, ...M.finalPair)
      const cam = fit(R, b, M.finalFill)
      // BOTTOM-anchored (P3-B5): the frame's foot sits exactly on the free
      // area's floor, --cam-final-foot above the pin's bottom, so the copy
      // after the runway can be pulled up by that same CSS length and land a
      // fixed gap under the screens (story.module.css .runway margin-bottom)
      return { ...cam, ry: R.y + R.h - (cam.s * b.h) / 2 }
    }

    /**
     * The print frame for a printed fraction 0..1: the printer and as much
     * slip as has come out. At 0 that is the printer alone, --cam-printer-w
     * of the pin's width (capped to the free area's height), centred; as the
     * slip feeds the box grows down and the camera eases back so its foot
     * stays in frame, ending on printer + slip at --cam-print-h of the pin.
     */
    const printFrame = (printed: number): Cam => {
      const R = M.region as Region
      const P = M.printerBox
      const S = M.slipBox
      const b = printed > 0 ? union(P, { ...S, h: S.h * printed }) : P
      const cam = fit(R, b, 0.96, M.printH)
      // the printer-width cap; the box's fit (height, free area) still wins
      return { ...cam, s: Math.min(cam.s, (M.printW * R.pinW) / P.w) }
    }

    const num = (cs: CSSStyleDeclaration, name: string, fallback: number) => {
      const v = parseFloat(cs.getPropertyValue(name))
      return Number.isFinite(v) ? v : fallback
    }

    const measure = () => {
      const runway = runwayRef.current
      if (runway) {
        M.runTop = runway.getBoundingClientRect().top + window.scrollY
        M.runTotal = runway.offsetHeight - window.innerHeight
      }
      const cq = stage.clientWidth / 100
      M.cq = cq
      const cs = getComputedStyle(stage)
      M.rigShift = num(cs, "--rig-shift", -14) * cq
      M.postX = num(cs, "--g-post-x", 0) * cq
      M.postY = num(cs, "--g-post-y", 0) * cq
      M.postS = num(cs, "--g-post-s", 1)
      M.phoneDash = num(cs, "--phone-dash", 0) > 0
      M.bowRot = num(cs, "--bow-rot", 7)
      setPhoneDash(M.phoneDash)

      const paper = paperRef.current
      const fold = foldRef.current
      const bin = binRef.current
      const printer = printerRef.current
      const group = groupRef.current
      const device = deviceRef.current
      const phone = phoneRef.current
      const lid = lidRef.current
      const card = cardDashRef.current
      if (!paper || !fold || !bin || !printer || !group || !device || !phone || !lid || !card) return

      M.paperW = paper.offsetWidth
      M.foldH = fold.offsetHeight || 1

      // the flight: paper centre (rig fully shifted) -> the bin's mouth
      const pb = offsetIn(paper, stage)
      const bb = offsetIn(bin, stage)
      M.binW = bb.w
      M.flyDx = bb.x + bb.w / 2 - (pb.x + pb.w / 2 + M.rigShift)
      M.flyDy = bb.y + bb.h * 0.26 - (pb.y + pb.h / 2)

      // The group's layout box IS the tap pose (big, centred). Where it ends
      // up once the laptop arrives is a transform: `post` offset and scale
      // about its centre. Scaling a transform, not the layout, keeps the App
      // Clip kit's unit floors out of it. `post()` maps a rest point there.
      const gb = offsetIn(group, stage)
      const gcx = gb.x + gb.w / 2
      const gcy = gb.y + gb.h / 2
      const post = (x: number, y: number) => [gcx + M.postX + M.postS * (x - gcx), gcy + M.postY + M.postS * (y - gcy)]
      // the merge point: the device's centre in the tap pose
      const db = offsetIn(device, stage)
      const mx = db.x + db.w / 2
      const my = db.y + db.h / 2
      const prb = offsetIn(printer, stage)
      M.prDx = mx - (prb.x + prb.w / 2 + M.rigShift)
      M.prDy = my - (prb.y + prb.h / 2)
      M.bnDx = mx - (bb.x + bb.w / 2)
      M.bnDy = my - (bb.y + bb.h / 2)

      // the phone: how far it rises, and the bow onto the device
      const phb = offsetIn(phone, stage)
      M.phoneH = phb.h
      M.bowX = (db.x + db.w * 0.45 - (phb.x + phb.w / 2)) * 0.18
      M.bowY = 4.2 * cq
      M.lapIn = 5 * cq

      // the spark: phone screen centre -> the laptop's hinge, as a quadratic
      // curve bowed away from the straight line (up on a wide stage, out to
      // the side on a tall one), sampled into SPARK_N points. On phones it
      // lands in the card's lower left, where the card then blooms from.
      const cb = offsetIn(card, stage)
      M.bloomX = cb.w * 0.3
      M.bloomY = cb.h * 0.72
      // + 60: the circle ends past the card's shadow, so dropping it for "none" never pops
      M.bloomR = Math.hypot(Math.max(M.bloomX, cb.w - M.bloomX), Math.max(M.bloomY, cb.h - M.bloomY)) + 60
      const lb = offsetIn(lid, stage)
      const la = offsetIn(laptop, stage)
      const [x0, y0] = post(phb.x + phb.w / 2, phb.y + phb.h * 0.46)
      const x2 = M.phoneDash ? cb.x + M.bloomX : lb.x + lb.w / 2
      const y2 = M.phoneDash ? cb.y + M.bloomY : lb.y + lb.h
      const dx = x2 - x0
      const dy = y2 - y0
      const len = Math.hypot(dx, dy) || 1
      let nx = -dy / len
      let ny = dx / len
      if (Math.abs(dx) >= Math.abs(dy) ? ny > 0 : nx < 0) {
        nx = -nx
        ny = -ny
      }
      const bow = 0.3 * len
      const x1 = (x0 + x2) / 2 + nx * bow
      const y1 = (y0 + y2) / 2 + ny * bow
      M.path = []
      for (let i = 0; i < SPARK_N; i++) {
        const t = i / (SPARK_N - 1)
        const u = 1 - t
        const x = u * u * x0 + 2 * u * t * x1 + t * t * x2
        const y = u * u * y0 + 2 * u * t * y1 + t * t * y2
        M.path.push(x, y)
        // tangent, so each dot is a short dash lying along the line
        const tx = 2 * u * (x1 - x0) + 2 * t * (x2 - x1)
        const ty = 2 * u * (y1 - y0) + 2 * t * (y2 - y1)
        const dot = dotRefs.current[i]
        if (dot) dot.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${Math.atan2(ty, tx).toFixed(3)}rad)`
      }
      const burst = burstRef.current
      if (burst) burst.style.left = `${x2}px`
      if (burst) burst.style.top = `${y2}px`
      const launch = launchRef.current
      if (launch) launch.style.left = `${x0}px`
      if (launch) launch.style.top = `${y0}px`

      // ---- the camera's frames ------------------------------------------
      // Each is a box in stage px (layout, no transforms) that should fill
      // the pin's free area at that beat; fit() turns it into a centre and
      // a zoom. The free area: under the nav (--cam-top), above the caption,
      // --cam-side from the viewport's edges, in the stage's own coordinates.
      M.cams = []
      M.region = null
      M.finalRegion = null
      const pcs = getComputedStyle(pin)
      if (num(cs, "--cam", 1) > 0) {
        const hint = hintRef.current
        const top = num(pcs, "--cam-top", 92)
        const sideX = num(pcs, "--cam-side", 32)
        const bottom = hint ? hint.offsetTop - num(pcs, "--cam-gap", 12) : pin.clientHeight - 64
        const R: Region = {
          x: sideX - stage.offsetLeft,
          y: top - stage.offsetTop,
          w: pin.clientWidth - 2 * sideX,
          h: bottom - top,
          pinH: pin.clientHeight,
          pinW: pin.clientWidth,
        }
        M.region = R
        const foot = num(pcs, "--cam-final-foot", 110)
        M.finalRegion = { ...R, h: pin.clientHeight - foot - top }
        const postBox = (b: Box): Box => {
          const [x0, y0] = post(b.x, b.y)
          const [x1, y1] = post(b.x + b.w, b.y + b.h)
          return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
        }
        // the slip at full length (the feed is a clip-path; its box is whole)
        const slip = offsetIn(paper, stage)
        M.phoneBox = phb
        M.devBox = db
        // print: follows the slip out (printFrame); [0] is the printed slip
        M.printerBox = prb
        M.slipBox = slip
        M.printW = num(pcs, "--cam-printer-w", 0.42)
        M.printH = num(pcs, "--cam-print-h", 0.7)
        const kPrint = printFrame(1)
        // trash: the rig shifted left, and the bin
        const kTrash = fit(R, union(shiftBox(prb, M.rigShift), shiftBox(slip, M.rigShift), bb), 0.96)
        // tap: the phone on the device, as big as the free area allows
        const kTap = fit(R, union(phb, db), TAP_FILL)
        // final: the laptop (lid + deck) and the pair in its post-slide spot
        M.lapBox = la
        M.finalPair = [postBox(phb), postBox(db)]
        M.finalFill = num(pcs, "--cam-final-fill", 0.94)
        M.lidH = lb.h
        M.persp = parseFloat(getComputedStyle(laptop).perspective) || 1400
        const kFinal = finalFrame(1)
        // [3] the lid up (the hold), [4] the lid still flat (its widest)
        M.cams = [kPrint, kTrash, kTap, kFinal, finalFrame(0)]
      }
    }

    // Every write goes through set(): unchanged values are dropped, and the
    // only properties it is ever asked to write are transform, opacity and
    // clip-path.
    const last = new Map<string, string>()
    const set = (el: HTMLElement | null | undefined, prop: "transform" | "opacity" | "clip-path", val: string, key: string) => {
      if (!el || last.get(key) === val) return
      last.set(key, val)
      el.style.setProperty(prop, val)
    }
    const op = (el: HTMLElement | null | undefined, v: number, key: string) => set(el, "opacity", clamp01(v).toFixed(3), key)

    let phaseNow: Phase = "idle"
    const setPhaseOnce = (next: Phase) => {
      if (phaseNow === next) return
      phaseNow = next
      setPhase(next)
    }

    const draw = (p: number) => {
      const cq = M.cq
      const q = clamp01(p / T.act1)

      // ---- ACT 1: print ------------------------------------------------------
      // The slip is revealed from the slot DOWN, header first: the fold
      // polygon's y values are scaled by the print fraction (it is the flat
      // key-0 rectangle until the fold starts, and print is 1 from then on).
      const print = ease(seg(q, 0, Q.printEnd))
      set(
        shadowRef.current,
        "clip-path",
        print < 1 ? `inset(-12% -20% ${((1 - print) * 100).toFixed(2)}% -20%)` : "none",
        "shadowC",
      )

      // ---- shift left + bin in ----------------------------------------------
      const shift = ease(seg(q, Q.shiftA, Q.shiftB))
      set(rigRef.current, "transform", `translateX(${(M.rigShift * shift).toFixed(1)}px)`, "rig")

      // ---- the fold (unchanged maths, fold.ts) ------------------------------
      const fold = foldRef.current
      const fRaw = seg(q, Q.foldA, Q.foldB)
      const wings = ease(seg(q, Q.foldB, Q.planeEnd))
      let keyPos: number
      let activeRound: number
      let rt: number
      if (q >= Q.foldB) {
        keyPos = 5 + wings
        activeRound = 3
        rt = 1
      } else if (fRaw < Q.rCorners) {
        rt = fRaw / Q.rCorners
        keyPos = rt * 2
        activeRound = 0
      } else if (fRaw < Q.rEdges) {
        rt = (fRaw - Q.rCorners) / (Q.rEdges - Q.rCorners)
        keyPos = 2 + rt * 2
        activeRound = 1
      } else {
        rt = (fRaw - Q.rEdges) / (1 - Q.rEdges)
        keyPos = 4 + rt
        activeRound = 2
      }
      const i0 = Math.min(FOLD_VECS.length - 2, Math.floor(keyPos))
      const ft = keyPos - i0
      const a = FOLD_VECS[i0]
      const b = FOLD_VECS[i0 + 1]
      const v = (n: number) => a[n] + (b[n] - a[n]) * ft
      let d = ""
      for (let n = 0; n < POLY_N; n++) d += `${n ? "," : ""}${v(V_POLY + n * 2).toFixed(2)}% ${(v(V_POLY + n * 2 + 1) * print).toFixed(2)}%`
      set(fold, "clip-path", `polygon(${d})`, "foldClip")
      set(
        fold,
        "transform",
        `scale(${v(0).toFixed(4)}) scaleY(${v(1).toFixed(4)}) rotate(${v(2).toFixed(3)}deg) rotateY(${(-16 * wings).toFixed(2)}deg)`,
        "foldT",
      )
      op(inkRef.current, v(3), "ink")
      op(shadowRef.current, 1 - seg(q, Q.foldA, Q.foldA + 0.05), "shadow")

      // creases + landed-flap shades: clip-path quads, not SVG attributes
      const creaseOut = 1 - seg(q, Q.foldB - 0.035, Q.foldB)
      for (let n = 0; n < 3; n++) {
        const el = creaseRefs.current[n]
        const o = V_CREASE + n * 5
        const alpha = v(o + 4) * creaseOut
        op(el, alpha, `cO${n}`)
        // geometry is written even while invisible, so the frame at any p is
        // the same whatever path (scrub, jump, latch catch-up) led to it; the
        // write cache makes the unchanged ones free
        set(el, "clip-path", lineQuad(v(o), v(o + 1), v(o + 2), v(o + 3)), `cC${n}`)
      }
      for (let n = 0; n < 2; n++) {
        const el = shadeRefs.current[n]
        const o = V_SHADE + n * 9
        const alpha = v(o + 8) * creaseOut
        op(el, alpha, `sO${n}`)
        const pts: number[][] = []
        for (let k = 0; k < 4; k++) pts.push([+v(o + k * 2).toFixed(2), +v(o + k * 2 + 1).toFixed(2)])
        set(el, "clip-path", poly(pts), `sC${n}`)
      }

      // the flap panels, turning over their creases in 3D
      const side = ROUNDS[activeRound]
      for (let n = 0; n < 2; n++) {
        const flap = flapRefs.current[n]
        const face = flapFaceRefs.current[n]
        if (!flap || !face) continue
        if (!side) {
          // idle (fold rounds 2-3 and after): a fixed resting pose, so the
          // invisible panel never carries history from how p got here
          op(flap, 0, `fO${n}`)
          set(flap, "transform", "none", `fT${n}`)
          set(face, "clip-path", poly(ROUNDS[1][n === 0 ? "left" : "right"]), `fC${n}`)
          op(flapShadeRefs.current[n], 0, `fS${n}`)
          continue
        }
        const axis = n === 0 ? side.axisL : side.axisR
        const region = n === 0 ? side.left : side.right
        const [[ox, oy], [tx2, ty2]] = axis
        const ax = -((tx2 - ox) / 100) * M.paperW
        const ay = -((ty2 - oy) / 100) * M.foldH
        const ang = 180 * ease(rt)
        set(face, "clip-path", poly(region), `fC${n}`)
        // the crease origin as a translate pair around the rotation, since
        // transform-origin is not one of the three properties we write
        const px = (ox / 100) * M.paperW
        const py = (oy / 100) * M.foldH
        set(
          flap,
          "transform",
          `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translateZ(1px) rotate3d(${ax.toFixed(2)}, ${ay.toFixed(2)}, 0, ${ang.toFixed(2)}deg) translate(${(-px).toFixed(1)}px, ${(-py).toFixed(1)}px)`,
          `fT${n}`,
        )
        op(flap, clamp01(rt * 40) * clamp01((1 - rt) * 40), `fO${n}`)
        op(flapShadeRefs.current[n], 0.2 * Math.sin(Math.PI * rt), `fS${n}`)
      }
      const half = halfRef.current
      set(halfFaceRef.current, "clip-path", poly(HALF_REGION), "hC")
      if (activeRound === 2) {
        op(half, rt * 22, "hO")
        set(half, "transform", `translateZ(1px) rotateY(${(180 * ease(rt)).toFixed(2)}deg)`, "hT")
      } else if (activeRound === 3) {
        op(half, 1 - wings / 0.5, "hO")
        set(half, "transform", `translateZ(1px) rotateY(${(180 - 145 * wings).toFixed(2)}deg)`, "hT")
      } else {
        op(half, 0, "hO")
        set(half, "transform", "translateZ(1px) rotateY(0deg)", "hT")
      }
      op(planeRef.current, clamp01((q - (Q.foldB + 0.02)) / 0.07) * 0.7, "plane")

      // the flight into the bin — measured target, no layout reads
      const fly = seg(q, Q.planeEnd, 1)
      const launch = -14 * wings
      if (fly <= 0) {
        set(paperRef.current, "transform", `rotate(${launch.toFixed(2)}deg)`, "paperT")
        op(paperRef.current, 1, "paperO")
      } else {
        const tx = M.flyDx * ease(fly)
        const ty = M.flyDy * fly * fly - Math.sin(Math.PI * fly) * 7 * cq
        set(
          paperRef.current,
          "transform",
          `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) rotate(${(launch + 78 * fly).toFixed(2)}deg) scale(${(1 - 0.58 * fly).toFixed(3)})`,
          "paperT",
        )
        op(paperRef.current, (1 - fly) / 0.12, "paperO")
      }

      // ---- ACT 2: printer + bin -> one slab -> the device; the phone rises ---
      const c = seg(p, T.convA, T.convB)
      const conv = ease(c)
      const mrg = ease(seg(p, T.mrgA, T.mrgB))
      const dev = ease(seg(p, T.devA, T.devB))
      const binIn = shift
      set(
        printerRef.current,
        "transform",
        `translate(${(M.prDx * conv).toFixed(1)}px, ${(M.prDy * c * c).toFixed(1)}px) scale(${(1 - 0.45 * conv).toFixed(4)})`,
        "prT",
      )
      op(printerRef.current, 1 - mrg, "prO")
      set(
        binRef.current,
        "transform",
        `translate(${((1 - binIn) * 1.7 * M.binW + M.bnDx * conv).toFixed(1)}px, ${(M.bnDy * (1 - (1 - c) * (1 - c))).toFixed(1)}px) scale(${(1 - 0.45 * conv).toFixed(4)})`,
        "binT",
      )
      op(binRef.current, binIn * (1 - mrg), "binO")

      // the slab (in the device's box) settles from the size of the two
      // objects that made it down to the device, and hands over to the art
      op(slabRef.current, mrg * (1 - dev), "slabO")
      set(slabRef.current, "transform", `scale(${(1.7 - 0.9 * dev).toFixed(4)}, ${(1.25 - 0.45 * dev).toFixed(4)})`, "slabT")
      // the art is opaque by mid-way, so the slab settles BEHIND it
      op(deviceRef.current, dev * 1.8, "devO")

      // the phone rises in front of the device, then bows onto it (the tap)
      const rise = ease(seg(p, T.phoneA, T.phoneB))
      const bow = ease(seg(p, T.bowA, T.bowB)) * (1 - ease(seg(p, T.upA, T.upB)))
      set(
        phoneRef.current,
        "transform",
        `translate(${(M.bowX * bow).toFixed(1)}px, ${((1 - rise) * 0.35 * M.phoneH + M.bowY * bow).toFixed(1)}px) rotate(${(M.bowRot * bow).toFixed(2)}deg)`,
        "phT",
      )
      op(phoneRef.current, rise * 3, "phO")
      // the screen: lock -> App Clip card -> "Reading" -> the receipt
      op(cardRef.current, seg(p, T.cardA, T.cardB), "card")
      op(readRef.current, seg(p, T.readA, T.readB), "read")
      op(rcptRef.current, seg(p, T.rcptA, T.rcptB), "rcpt")
      // NFC rings off the device's top face, one after another
      for (let n = 0; n < 3; n++) {
        const t = seg(p, T.ringsA + n * 0.018, T.ringsA + n * 0.018 + 0.04)
        const ring = ringRefs.current[n]
        op(ring, t > 0 && t < 1 ? (1 - t) * 0.95 : 0, `rO${n}`)
        set(ring, "transform", `translate(-50%, -50%) scale(${(0.4 + 0.95 * t).toFixed(3)})`, `rT${n}`)
      }
      op(glowRef.current, dev * (0.45 + 0.55 * Math.sin(Math.PI * seg(p, T.bowA, T.upB))), "glow")

      // ---- the spark: phone + device slide right, the laptop opens left -----
      const g = ease(seg(p, T.slideA, T.slideB))
      set(
        groupRef.current,
        "transform",
        `translate(${(M.postX * g).toFixed(1)}px, ${(M.postY * g).toFixed(1)}px) scale(${(1 + (M.postS - 1) * g).toFixed(4)})`,
        "grpT",
      )
      const open = ease(seg(p, T.openA, T.openB))
      if (!M.phoneDash) {
        const lap = ease(seg(p, T.slideA + 0.01, T.slideB))
        op(laptop, lap, "lapO")
        set(laptop, "transform", `translateX(${(-(1 - lap) * M.lapIn).toFixed(1)}px)`, "lapT")
        set(lidRef.current, "transform", `rotateX(${(-90 + 90 * open).toFixed(2)}deg)`, "lidT")
        op(lidRef.current, open > 0.002 ? 1 : 0, "lidO")
        set(deckRef.current, "transform", `translateX(-50%) scaleY(${(0.35 + 0.65 * open).toFixed(3)})`, "deckT")
        // the screen lights up as it opens
        op(dimRef.current, 1 - ease(seg(p, T.openA + 0.02, T.openB + 0.01)), "dim")
      } else {
        // phones: the dashboard card blooms open from where the spark lands
        const card = cardDashRef.current
        op(card, open > 0.002 ? 1 : 0, "pdO")
        set(
          card,
          "clip-path",
          open >= 0.999
            ? "none"
            : `circle(${(M.bloomR * open).toFixed(1)}px at ${M.bloomX.toFixed(1)}px ${M.bloomY.toFixed(1)}px)`,
          "pdC",
        )
      }

      const sp = seg(p, T.sparkA, T.sparkB)
      const hp = sp * (SPARK_N - 1 + SPARK_TRAIL)
      for (let i = 0; i < SPARK_N; i++) {
        const dd = hp - i
        op(dotRefs.current[i], dd <= 0 || dd >= SPARK_TRAIL ? 0 : 1 - dd / SPARK_TRAIL, `d${i}`)
      }
      const hi = Math.min(SPARK_N - 1, hp)
      const h0 = Math.floor(hi)
      const h1 = Math.min(SPARK_N - 1, h0 + 1)
      const hf = hi - h0
      const path = M.path
      if (path.length) {
        const hx = path[h0 * 2] + (path[h1 * 2] - path[h0 * 2]) * hf
        const hy = path[h0 * 2 + 1] + (path[h1 * 2 + 1] - path[h0 * 2 + 1]) * hf
        set(headRef.current, "transform", `translate(${hx.toFixed(1)}px, ${hy.toFixed(1)}px)`, "headT")
      }
      op(headRef.current, sp > 0 && hp < SPARK_N - 1 ? 1 : 0, "headO")
      const launchT = seg(p, T.sparkA - 0.012, T.sparkA + 0.03)
      op(launchRef.current, Math.sin(Math.PI * launchT), "launchO")
      set(launchRef.current, "transform", `translate(-50%, -50%) scale(${(0.5 + 0.9 * launchT).toFixed(3)})`, "launchT")
      const burstT = seg(p, T.sparkB - 0.02, T.sparkB + 0.03)
      op(burstRef.current, Math.sin(Math.PI * burstT), "burstO")
      set(burstRef.current, "transform", `translate(-50%, -50%) scale(${(0.3 + 1.6 * burstT).toFixed(3)})`, "burstT")

      // ---- delivery: the sale lands on the dashboard ------------------------
      const fl = seg(p, T.fillA, T.fillB)
      const dur = 0.34
      const step = fillKeys > 1 ? (1 - dur) / (fillKeys - 1) : 0
      // only the dashboard on screen: the laptop's, or the phone card's
      const fills = M.phoneDash ? fillsCard : fillsLap
      const empties = M.phoneDash ? emptiesCard : emptiesLap
      const pre = M.phoneDash ? "p" : ""
      for (let n = 0; n < fills.length; n++) {
        const f = fills[n]
        const t = ease(seg(fl, f.key * step, f.key * step + dur))
        const key = `${pre}f${n}`
        if (f.kind === "growY") set(f.el, "transform", `scaleY(${t.toFixed(3)})`, key)
        else if (f.kind === "growX") set(f.el, "transform", `scaleX(${t.toFixed(3)})`, key)
        else {
          op(f.el, t, `${key}o`)
          if (f.kind === "rise") set(f.el, "transform", `translateY(${((1 - t) * 0.9 * cq).toFixed(1)}px)`, key)
        }
      }
      for (let n = 0; n < empties.length; n++) {
        const e = empties[n]
        op(e.el, 1 - ease(seg(fl, e.key * step, e.key * step + dur * 0.6)), `${pre}e${n}`)
      }

      // ---- the camera ------------------------------------------------------
      // print -> trash as the rig shifts; trash -> tap across the merge; tap
      // -> final with the slide. Centre moves linearly, zoom geometrically,
      // both on the eased clock.
      const cams = M.cams
      if (cams.length === 5) {
        // leads the rig's shift a touch, so the bin sliding in is framed
        const k1 = ease(seg(q, Q.shiftA - 0.06, Q.shiftB - 0.02))
        // done soon after the phone starts rising; from there the tap frame
        // itself tracks the rise (tapNow), so the phone is always framed
        const k2 = ease(seg(p, T.convA, T.phoneA + 0.02))
        // leads the group's slide a touch, so the laptop fading in on the
        // left is inside the frame from its first visible frame
        const k3 = ease(seg(p, T.slideA - 0.015, T.slideB - 0.02))
        // while the phone rises, the tap frame holds it where it is (still
        // low), so its foot is never under the caption or off the screen
        const riseDy = (1 - rise) * 0.35 * M.phoneH
        const tapNow =
          riseDy > 0.5 && M.region ? fit(M.region, union(shiftBox(M.phoneBox, 0, riseDy), M.devBox), TAP_FILL) : cams[2]
        const finalNow = open > 0 && open < 1 ? finalFrame(open) : open >= 1 ? cams[3] : cams[4]
        const [a0, b0, t0] =
          k3 > 0 ? [cams[2], finalNow, k3] : k2 > 0 ? [cams[1], tapNow, k2] : [print < 1 ? printFrame(print) : cams[0], cams[1], k1]
        const cs = a0.s * Math.pow(b0.s / a0.s, t0)
        const cx = a0.x + (b0.x - a0.x) * t0
        const cy = a0.y + (b0.y - a0.y) * t0
        const rx = a0.rx + (b0.rx - a0.rx) * t0
        const ry = a0.ry + (b0.ry - a0.ry) * t0
        set(
          camRef.current,
          "transform",
          `translate(${(rx - cs * cx).toFixed(1)}px, ${(ry - cs * cy).toFixed(1)}px) scale(${cs.toFixed(4)})`,
          "camT",
        )
      } else set(camRef.current, "transform", "none", "camT")

      op(
        groupRef.current,
        M.phoneDash
          ? // phones: the pair fades under the card as it blooms
            1 - ease(seg(p, T.openA + 0.02, T.openB))
          : 1,
        "grpO",
      )
      op(hintRef.current, 1 - ease(seg(p, T.dockA, T.dockA + 0.04)), "hint")

      setPhaseOnce(
        p >= T.dockA
          ? "info"
          : p >= T.fillA
            ? "dash"
            : p >= T.slideA
              ? "spark"
              : p >= T.rcptA - 0.01
                ? "receipt"
                : p >= T.bowA
                  ? "tap"
                  : p >= T.convA
                    ? "merge"
                    : q >= Q.lid
                      ? "landed"
                      : q >= Q.shiftA
                        ? "trash"
                        : "print",
      )
    }

    // ---- the latch -------------------------------------------------------
    // `live` is the story's scroll progress; `shown` is the progress actually
    // drawn. They are the same number except (a) while LATCHED, when `shown`
    // is held at the fully-open end state, and (b) for the few hundred ms of
    // an eased catch-up right after the latch engages or lets go, so the
    // switch never snaps. Everything else stays a pure function of scroll.
    // in units of the scroll's own progress (0..1 -> p 0..P_END): latch at
    // the end; letting go lands in the hold (p >= fillB), never the delivery
    const P_LATCH = 0.99
    const P_RELEASE = P_LATCH - REVERSE_VH / SCROLL_VH
    let latched = false
    let catching = false
    let shown = -1
    let lastT = 0
    let isLive = false
    let armed = false
    const runway = runwayRef.current
    const setLiveOnce = (next: boolean) => {
      if (isLive === next) return
      isLive = next
      setLive(next)
      // for tests / debugging only: a state flag, written on change, not per frame
      if (runway) runway.dataset.live = next ? "1" : "0"
    }

    let raf: number | null = null
    const update = (now: number) => {
      raf = null
      // No layout read here either: where the runway sits on the page and how
      // far it scrolls are measured; the frame only needs scrollY.
      const raw = M.runTotal > 0 ? clamp01((window.scrollY - M.runTop) / M.runTotal) : 0
      const live = Math.min(1, (raw * (SCROLL_VH + DWELL_VH)) / SCROLL_VH)
      const wasLatched = latched
      if (!latched && live >= P_LATCH) latched = true
      else if (latched && live < P_RELEASE) latched = false
      const target = latched ? 1 : live
      if (shown < 0) shown = target // first frame: no catch-up from nowhere
      else if (latched !== wasLatched) catching = true
      if (catching) {
        const dt = Math.min(64, Math.max(0, now - lastT))
        shown += (target - shown) * (1 - Math.exp(-dt / CATCH_TAU_MS))
        if (Math.abs(target - shown) < 0.0015) catching = false
      }
      if (!catching) shown = target
      lastT = now
      draw(shown * P_END)
      if (runway) runway.dataset.settled = catching ? "0" : "1"
      // usable only at rest: from the end of the delivery on, or latched
      const hold = shown * P_END >= T.fillB
      setLiveOnce(!catching && (latched || hold))
      // running back into the delivery: put both screens back to its frame
      if (shown * P_END >= T.fillB) armed = true
      else if (armed) {
        armed = false
        setReset((n) => n + 1)
      }
      // the catch-up is the only thing that animates without a scroll event
      if (catching && raf === null) raf = requestAnimationFrame(update)
    }
    const onScroll = () => {
      if (raf === null) raf = requestAnimationFrame(update)
    }
    const onResize = () => {
      measure()
      // a measure changes numbers the cache has already written
      last.clear()
      onScroll()
    }

    measure()
    update(performance.now())
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)
    const ro = new ResizeObserver(onResize)
    ro.observe(stage)
    ro.observe(pin)
    // anything above the runway changing height moves where it starts
    ro.observe(document.documentElement)
    // fonts landing can change the caption's box (the camera's floor)
    document.fonts?.ready.then(onResize).catch(() => {})
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      ro.disconnect()
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [pinned])

  // The dashboard's explanation, after the scene in both versions (in flow,
  // so the pinned screen never has to hold it): the heading block (its lead
  // carries the customer line), air, then the three columns, then the
  // ribbon: one unit, so any spare room on a tall screen falls AFTER the
  // ribbon (story.module.css .unit), never between the lines of text.
  const after = (
    <div className={s.unit}>
      <div className={s.after}>
        <DashboardCopy className={s.afterCopy} />
        <DashboardColumns />
      </div>
      <MarqueeBand />
    </div>
  )
  const staticVersion =
    mode === "scene" ? null : (
      <div className={`${s.staticSlot} ${s.col}`} data-nojs="static">
        <StaticStory />
      </div>
    )
  if (mode === "static")
    return (
      <>
        {staticVersion}
        {after}
      </>
    )

  return (
    <>
    {staticVersion}
    <div ref={runwayRef} className={s.runway} data-nojs="runway" style={{ height: `${RUNWAY_VH}vh` }}>
      {/* The story for assistive tech: the scene itself is decorative. */}
      <ol className="sr-only">
        {Object.values(story.beats).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>

      <div className={s.pin} ref={pinRef}>
        {/* Every piece of art is decorative (the <ol> above tells the story)
            and inert while it moves. The exceptions are the two screens —
            the laptop's dashboard (the phone dashboard on phones) and the
            customer's phone — which become real, focusable UIs while the
            scene is at rest (the hold, or latched open). */}
        <div className={s.stage} ref={stageRef}>
          {/* the camera: one transform over the whole scene (see THE CAMERA) */}
          <div className={s.cam} ref={camRef}>
          <span className={s.ground} ref={groundRef} aria-hidden="true" />

          {/* ---- act 1: printer + slip travel together as the rig ---- */}
          <div className={s.rig} ref={rigRef} aria-hidden="true" inert>
            <div className={s.feedClip}>
              <div className={s.paper} ref={paperRef}>
                <span className={s.paperShadow} ref={shadowRef} />
                <div className={s.fold} ref={foldRef}>
                  <div className={s.sheet}>
                    <div className={s.ink} ref={inkRef}>
                      <SlipBody summary={summary} />
                    </div>
                  </div>
                  {[0, 1].map((n) => (
                    <span
                      key={`shade-${n}`}
                      className={s.shade}
                      ref={(el) => {
                        shadeRefs.current[n] = el
                      }}
                    />
                  ))}
                  {[0, 1, 2].map((n) => (
                    <span
                      key={`crease-${n}`}
                      className={s.crease}
                      ref={(el) => {
                        creaseRefs.current[n] = el
                      }}
                    />
                  ))}
                </div>
                {[0, 1].map((n) => (
                  <div
                    key={`flap-${n}`}
                    className={s.flap}
                    ref={(el) => {
                      flapRefs.current[n] = el
                    }}
                  >
                    <div
                      className={s.flapFace}
                      ref={(el) => {
                        flapFaceRefs.current[n] = el
                      }}
                    >
                      <span
                        className={s.flapShade}
                        ref={(el) => {
                          flapShadeRefs.current[n] = el
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div className={cn(s.flap, s.half)} ref={halfRef}>
                  <div className={s.flapFace} ref={halfFaceRef}>
                    <span className={s.flapShade} style={{ opacity: 0.2 }} />
                  </div>
                </div>
                <span className={s.plane} ref={planeRef}>
                  <PlaneMark body="transparent" lines="rgba(27, 36, 46, 0.5)" size={100} />
                </span>
              </div>
            </div>
            <Printer busy={phase === "print"} ref={printerRef} />
          </div>

          <div aria-hidden="true" inert className="contents">
            <Bin landed={phase === "landed"} ref={binRef} />
          </div>

          {/* ---- the laptop, on the left (final layout) ---- */}
          <div
            className={s.laptop}
            ref={laptopRef}
            aria-hidden={!live}
            inert={!live}
            role={live ? "region" : undefined}
            aria-label={live ? story.laptopLabel : undefined}
          >
            <div className={s.lid} ref={lidRef}>
              <div className={s.screen}>
                <FitFrame width={DASH_W} height={DASH_H} fallback={0.58}>
                  <MerchantDemo layout="desktop" reset={reset} />
                </FitFrame>
                <span className={s.screenDim} ref={dimRef} />
              </div>
            </div>
            <div className={s.deck} ref={deckRef}>
              <span className={s.keys} />
              <span className={s.pad} />
            </div>
            <TryIt on={live} className={s.tryLaptop} />
          </div>

          {/* ---- phone + device, on the right (final layout); the group's
                 pre-slide pose is a transform from measured numbers ---- */}
          <div
            className={s.group}
            ref={groupRef}
            aria-hidden={!(live && !phoneDash)}
            inert={!(live && !phoneDash)}
            role={live && !phoneDash ? "region" : undefined}
            aria-label={live && !phoneDash ? story.phoneLabel : undefined}
          >
            <div className={s.device}>
              <span className={s.deviceGlow} ref={glowRef} />
              <span className={s.slab} ref={slabRef} />
              <div className={s.deviceArt} ref={deviceRef}>
                <DeviceArt className={s.fill} />
              </div>
              {[0, 1, 2].map((n) => (
                <span
                  key={`ring-${n}`}
                  className={s.ring}
                  ref={(el) => {
                    ringRefs.current[n] = el
                  }}
                />
              ))}
            </div>
            <div className={s.phone} ref={phoneRef}>
              <PhoneChrome islandLock>
                <div className={cn(s.layer, s.layerBase)}>
                  <ClipLockScreen card={false} prompt={story.lockPrompt} moment={moment} />
                </div>
                <div className={s.layer} ref={cardRef}>
                  <ClipLockScreen card prompt={story.lockPrompt} moment={moment} />
                </div>
                <div className={s.layer} ref={readRef}>
                  <ClipReading time={moment.time} />
                </div>
                <div className={cn(s.layer, s.layerClip)} ref={rcptRef}>
                  <ClipScreen summary={summary} />
                </div>
                <PhoneApp summary={summary} live={live && !phoneDash} reset={reset} />
              </PhoneChrome>
              <TryIt on={live && !phoneDash} className={s.tryPhone} />
            </div>
          </div>

          {/* ---- phones (<=820px): the dashboard's own mobile layout on a
                 phone, in place of the laptop (hidden there). Painted after
                 the group, so it covers the pair as it blooms; the spark
                 (z 6) stays above it. ---- */}
          <div
            className={s.pdScene}
            ref={cardDashRef}
            aria-hidden={!live}
            inert={!live}
            role={live ? "region" : undefined}
            aria-label={live ? story.laptopLabel : undefined}
          >
            <div className={s.pdPhone}>
              <PhoneChrome>
                <FitFrame width={393} height={852} fallback={0.68}>
                  <MerchantDemo layout="mobile" reset={reset} />
                </FitFrame>
              </PhoneChrome>
            </div>
            <TryIt on={live && phoneDash} className={s.tryPd} />
          </div>

          {/* ---- the spark ---- */}
          <div className={s.spark} aria-hidden="true">
            <span className={s.launch} ref={launchRef} />
            {Array.from({ length: SPARK_N }, (_, i) => (
              <span
                key={i}
                className={s.dot}
                ref={(el) => {
                  dotRefs.current[i] = el
                }}
              />
            ))}
            <span className={s.head} ref={headRef} />
            <span className={s.burst} ref={burstRef} />
          </div>
          </div>
        </div>

        <p className={s.hint} ref={hintRef} aria-hidden="true">
          {HINT[phase]}
        </p>

      </div>
    </div>
    {after}
    </>
  )
}
