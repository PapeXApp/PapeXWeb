"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { PlaneMark } from "@/components/brand/plane-mark"
import { useSafeReducedMotion } from "@/components/motion/useSafeReducedMotion"
import { ClipLockScreen, ClipReading } from "../../customer/appui"
import { receiptMoment } from "../../customer/appui/Clip"
import { ClipReceiptScreen } from "../../customer/ReceiptCard"
import { PhoneChrome } from "../../customer/WalkPhone"
import { CustomerLine, DashboardColumns, DashboardCopy } from "../DashboardPreview"
import { story } from "../story"
import { Dashboard } from "./Dashboard"
import { Bin, DeviceArt, Printer } from "./Furniture"
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
 *                       the pair shrinks up to the top-right instead, over a
 *                       full-width laptop.
 *   0.72-0.82  DELIVER  the sale lands on the drawn dashboard: new-receipt
 *                       row, the four tiles, its hour's bar, its items
 *   0.83-1.00  VALUE    the three-part row settles to the top of the pin and
 *                       the dashboard info rises in under it. On phones only
 *                       the laptop docks; phone + device fade out, since a
 *                       three-part row at 390px wide would be too small to read.
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

/** Scroll budget in viewport heights; the runway adds the pinned 100vh. */
const SCROLL_VH = 300
const RUNWAY_VH = 100 + SCROLL_VH

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
  // delivery onto the dashboard
  fillA: 0.72,
  fillB: 0.82,
  // value
  dockA: 0.83,
  dockB: 0.92,
  copyA: 0.86,
  copyB: 0.93,
  colsA: 0.88,
  colsB: 0.95,
  custA: 0.9,
  custB: 0.965,
  scrollA: 0.95,
  scrollB: 0.99,
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
  const reduced = useSafeReducedMotion()
  // Client-only: the server renders the static story (see StaticStory.tsx).
  const [pinned, setPinned] = useState(false)
  const [phase, setPhase] = useState<Phase>("idle")
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
  const lidRef = useRef<HTMLDivElement>(null)
  const deckRef = useRef<HTMLDivElement>(null)
  const dimRef = useRef<HTMLSpanElement>(null)
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([])
  const headRef = useRef<HTMLSpanElement>(null)
  const burstRef = useRef<HTMLSpanElement>(null)
  const launchRef = useRef<HTMLSpanElement>(null)
  const hintRef = useRef<HTMLParagraphElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)
  const infoInnerRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const colsRef = useRef<HTMLDivElement>(null)
  const custRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPinned(!reduced)
  }, [reduced])

  useEffect(() => {
    if (!pinned) return
    const stage = stageRef.current
    const pin = pinRef.current
    const laptop = laptopRef.current
    if (!stage || !pin || !laptop) return

    // Collected ONCE: the dashboard's pieces that receive the delivered sale.
    const fills: Fill[] = Array.from(laptop.querySelectorAll<HTMLElement>("[data-fill]")).map((el) => ({
      el,
      key: Number(el.dataset.fill),
      kind: el.dataset.kind ?? "fade",
    }))
    const empties = Array.from(laptop.querySelectorAll<HTMLElement>("[data-empty]")).map((el) => ({
      el,
      key: Number(el.dataset.empty),
    }))
    const fillKeys = Math.max(1, ...fills.map((f) => f.key + 1))

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
      dockGroup: true,
      phoneH: 0,
      bowX: 0,
      bowY: 0,
      lapIn: 0,
      path: [] as number[], // x,y pairs of the spark path, stage px
      dockTx: 0,
      dockTy: 0,
      dockS: 1,
      overflow: 0,
      shift: 0,
      runTop: 0,
      runTotal: 0,
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
      M.dockGroup = num(cs, "--dock-group", 1) > 0

      const paper = paperRef.current
      const fold = foldRef.current
      const bin = binRef.current
      const printer = printerRef.current
      const group = groupRef.current
      const device = deviceRef.current
      const phone = phoneRef.current
      const lid = lidRef.current
      if (!paper || !fold || !bin || !printer || !group || !device || !phone || !lid) return

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
      // the side on a tall one), sampled into SPARK_N points
      const lb = offsetIn(lid, stage)
      const [x0, y0] = post(phb.x + phb.w / 2, phb.y + phb.h * 0.46)
      const x2 = lb.x + lb.w / 2
      const y2 = lb.y + lb.h
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

      // the dock: the whole three-part row (laptop + phone/device) onto the
      // info layout's empty slot. The stage scales about its top-left.
      const slot = slotRef.current
      const info = infoRef.current
      const inner = infoInnerRef.current
      if (!slot || !info || !inner) return
      // desktop docks the whole three-part row; a phone docks the laptop
      // alone (the phone + device fade: they have delivered their receipt)
      const la = offsetIn(laptop, stage)
      const [gx0, gy0] = post(gb.x, gb.y)
      const [gx1, gy1] = post(gb.x + gb.w, gb.y + gb.h)
      const bx = M.dockGroup ? Math.min(la.x, gx0) : la.x
      const by = M.dockGroup ? Math.min(la.y, gy0) : la.y
      const bw = (M.dockGroup ? Math.max(la.x + la.w, gx1) : la.x + la.w) - bx
      const bh = (M.dockGroup ? Math.max(la.y + la.h, gy1) : la.y + la.h) - by
      const pr = pin.getBoundingClientRect()
      const sr = slot.getBoundingClientRect()
      const sx = sr.left - pr.left
      const sy = sr.top - pr.top + M.shift
      const sc = Math.min(sr.width / bw, sr.height / bh) || 1
      M.dockS = sc
      M.dockTx = sx + sr.width / 2 - sc * (bx + bw / 2) - stage.offsetLeft
      M.dockTy = sy + sr.height / 2 - sc * (by + bh / 2) - stage.offsetTop
      M.overflow = Math.max(0, inner.scrollHeight - inner.clientHeight, inner.offsetHeight - info.clientHeight)
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
        if (alpha > 0) set(el, "clip-path", lineQuad(v(o), v(o + 1), v(o + 2), v(o + 3)), `cC${n}`)
      }
      for (let n = 0; n < 2; n++) {
        const el = shadeRefs.current[n]
        const o = V_SHADE + n * 9
        const alpha = v(o + 8) * creaseOut
        op(el, alpha, `sO${n}`)
        if (alpha > 0) {
          const pts: number[][] = []
          for (let k = 0; k < 4; k++) pts.push([+v(o + k * 2).toFixed(2), +v(o + k * 2 + 1).toFixed(2)])
          set(el, "clip-path", poly(pts), `sC${n}`)
        }
      }

      // the flap panels, turning over their creases in 3D
      const side = ROUNDS[activeRound]
      for (let n = 0; n < 2; n++) {
        const flap = flapRefs.current[n]
        const face = flapFaceRefs.current[n]
        if (!flap || !face) continue
        if (!side) {
          op(flap, 0, `fO${n}`)
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
        `translate(${(M.bowX * bow).toFixed(1)}px, ${((1 - rise) * 0.35 * M.phoneH + M.bowY * bow).toFixed(1)}px) rotate(${(7 * bow).toFixed(2)}deg)`,
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
      const lap = ease(seg(p, T.slideA + 0.01, T.slideB))
      op(laptop, lap, "lapO")
      set(laptop, "transform", `translateX(${(-(1 - lap) * M.lapIn).toFixed(1)}px)`, "lapT")
      const open = ease(seg(p, T.openA, T.openB))
      set(lidRef.current, "transform", `rotateX(${(-90 + 90 * open).toFixed(2)}deg)`, "lidT")
      op(lidRef.current, open > 0.002 ? 1 : 0, "lidO")
      set(deckRef.current, "transform", `translateX(-50%) scaleY(${(0.35 + 0.65 * open).toFixed(3)})`, "deckT")
      // the screen lights up as it opens
      op(dimRef.current, 1 - ease(seg(p, T.openA + 0.02, T.openB + 0.01)), "dim")

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
      for (let n = 0; n < fills.length; n++) {
        const f = fills[n]
        const t = ease(seg(fl, f.key * step, f.key * step + dur))
        const key = `f${n}`
        if (f.kind === "growY") set(f.el, "transform", `scaleY(${t.toFixed(3)})`, key)
        else if (f.kind === "growX") set(f.el, "transform", `scaleX(${t.toFixed(3)})`, key)
        else {
          op(f.el, t, `${key}o`)
          if (f.kind === "rise") set(f.el, "transform", `translateY(${((1 - t) * 0.9 * cq).toFixed(1)}px)`, key)
        }
      }
      for (let n = 0; n < empties.length; n++) {
        const e = empties[n]
        op(e.el, 1 - ease(seg(fl, e.key * step, e.key * step + dur * 0.6)), `e${n}`)
      }

      // ---- value: dock the row, raise the info ------------------------------
      const ai = seg(p, T.dockA, 1)
      const dk = ease(seg(p, T.dockA, T.dockB))
      const shiftPx = ease(seg(p, T.scrollA, T.scrollB)) * M.overflow
      M.shift = shiftPx
      set(
        stage,
        "transform",
        dk > 0
          ? `translate(${(M.dockTx * dk).toFixed(1)}px, ${(M.dockTy * dk - shiftPx).toFixed(1)}px) scale(${(1 + (M.dockS - 1) * dk).toFixed(4)})`
          : "none",
        "stageT",
      )
      set(infoInnerRef.current, "transform", `translateY(${(-shiftPx).toFixed(1)}px)`, "infoT")
      op(groundRef.current, 1 - dk, "ground")
      op(groupRef.current, M.dockGroup ? 1 : 1 - ease(seg(p, T.dockA, T.dockA + 0.05)), "grpO")
      op(hintRef.current, 1 - ease(seg(p, T.dockA, T.dockA + 0.04)), "hint")
      const rise3 = (el: HTMLElement | null, t: number, key: string) => {
        op(el, t, `${key}O`)
        set(el, "transform", `translateY(${(26 * (1 - t)).toFixed(1)}px)`, `${key}T`)
      }
      rise3(copyRef.current, ease(seg(p, T.copyA, T.copyB)), "copy")
      rise3(colsRef.current, ease(seg(p, T.colsA, T.colsB)), "cols")
      rise3(custRef.current, ease(seg(p, T.custA, T.custB)), "cust")

      setPhaseOnce(
        ai > 0
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

    let raf: number | null = null
    const update = () => {
      raf = null
      // No layout read here either: where the runway sits on the page and how
      // far it scrolls are measured; the frame only needs scrollY.
      draw(M.runTotal > 0 ? clamp01((window.scrollY - M.runTop) / M.runTotal) : 0)
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
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)
    const ro = new ResizeObserver(onResize)
    ro.observe(stage)
    ro.observe(pin)
    // anything above the runway changing height moves where it starts
    ro.observe(document.documentElement)
    if (infoInnerRef.current) ro.observe(infoInnerRef.current)
    // fonts landing change the info block's height (the dock's slot)
    document.fonts?.ready.then(onResize).catch(() => {})
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      ro.disconnect()
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [pinned])

  if (!pinned) return <StaticStory />

  return (
    <div ref={runwayRef} className={s.runway} style={{ height: `${RUNWAY_VH}vh` }}>
      {/* The story for assistive tech: the scene itself is decorative. */}
      <ol className="sr-only">
        {Object.values(story.beats).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>

      <div className={s.pin} ref={pinRef}>
        {/* inert: the art is decorative (the <ol> above tells the story), and
            the reused clip receipt carries a <summary> that must not take focus */}
        <div className={s.stage} ref={stageRef} aria-hidden="true" inert>
          <span className={s.ground} ref={groundRef} />

          {/* ---- act 1: printer + slip travel together as the rig ---- */}
          <div className={s.rig} ref={rigRef}>
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

          <Bin landed={phase === "landed"} ref={binRef} />

          {/* ---- the laptop, on the left (final layout) ---- */}
          <div className={s.laptop} ref={laptopRef}>
            <div className={s.lid} ref={lidRef}>
              <div className={s.screen}>
                <Dashboard summary={summary} />
                <span className={s.screenDim} ref={dimRef} />
              </div>
            </div>
            <div className={s.deck} ref={deckRef}>
              <span className={s.keys} />
              <span className={s.pad} />
            </div>
          </div>

          {/* ---- phone + device, on the right (final layout); the group's
                 pre-slide pose is a transform from measured numbers ---- */}
          <div className={s.group} ref={groupRef}>
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
                  <ClipReceiptScreen summary={summary} />
                </div>
              </PhoneChrome>
            </div>
          </div>

          {/* ---- the spark ---- */}
          <div className={s.spark}>
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

        <p className={s.hint} ref={hintRef} aria-hidden="true">
          {HINT[phase]}
        </p>

        {/* the value: an empty slot the row docks into, then the info */}
        <div className={s.info} ref={infoRef}>
          <div className={s.infoInner} ref={infoInnerRef}>
            <div className={s.slot} ref={slotRef} aria-hidden="true" />
            <DashboardCopy className={s.infoCopy} ref={copyRef} />
            <DashboardColumns className={s.infoCols} ref={colsRef} />
            <div ref={custRef} className={s.infoCust}>
              <CustomerLine />
              <p className={s.paperNote}>{story.paperNote}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
