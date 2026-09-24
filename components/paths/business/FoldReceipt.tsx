"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { PlaneMark } from "@/components/brand/plane-mark"
import { useSafeReducedMotion } from "@/components/motion/useSafeReducedMotion"
import { whyMerchants } from "./content"
import styles from "./business.module.css"

/**
 * 3.2's four reasons, delivered the way a merchant gets them today: printed —
 * and then disposed of, entirely by scrolling.
 *
 * The section is a tall runway with a `position: sticky` 100vh stage (same
 * mechanism as components/motion/PinnedSequence.tsx). One scroll progress
 * value `p` drives the whole scene:
 *
 *   0.00 – 0.46  the slip feeds DOWN out of a centred printer
 *   0.46 – 0.56  printer + slip shift LEFT, the bin slides in from the right
 *   0.56 – 0.80  the slip FOLDS: corner flaps, then edge flaps, then in half
 *   0.80 – 0.90  the wings open: the paper's own outline becomes the mark
 *   0.90 – 1.00  the plane flies into the bin (lid pops at 0.97)
 *
 * The fold is real: three flap panels turn over their crease lines in 3D
 * (`rotate3d` about the crease, under a `perspective` on .frPaper), carrying a
 * clipped copy of the print that fades out as the flap passes ~60 degrees, so
 * a landed flap is blank paper covering the print underneath. The silhouette
 * narrows because the flaps have LEFT it, not because anything is scaled: the
 * sx/sy squash is down to a ~2% settle.
 *
 * Everything is reversible because nothing is a timer: scrolling back up
 * re-runs the same pure function of `p` in the other direction. That is also
 * why the fold no longer snaps — the six FOLD_KEYS below are all the SAME
 * shape (5 polygon points, 3 creases, 2 shade quads), so adjacent keys are
 * linearly interpolated on every frame instead of swapped every 260ms.
 *
 * The whole frame is written through refs inside one rAF: `clip-path`,
 * `transform` and a handful of custom properties. React state holds only the
 * coarse phase name, which changes at most six times in the whole scene.
 *
 * The receipt IS the section's content — there is no card grid under it. So
 * the claims have to be in the server HTML and survive a visitor who never
 * scrolls: every block renders unconditionally, and the server's frame is the
 * FINISHED one (slip printed, rig shifted, bin standing there). The client
 * rewinds it to p=0 on mount. Reduced motion never rewinds and never pins:
 * it keeps that finished frame, with no runway at all.
 */

type Phase = "idle" | "print" | "shift" | "fold" | "plane" | "fly" | "done" | "merge" | "dash"

/** Extra scroll runway, in viewport heights, on top of the pinned viewport. */
const RUNWAY_VH = 430

/**
 * Act 1 (print -> fold -> fly) now occupies the first 0.77 of the runway and
 * act 2 (the merge into a laptop) the rest. Rather than re-tune seven
 * constants, `draw` computes `q = p / ACT1_END` and act 1 reads `q`: every
 * boundary below still means exactly what it meant, and 0.77 * 430vh is the
 * same scroll distance act 1 had at 330vh.
 */
const ACT1_END = 0.77
/** Act 2, as fractions of the stretch after ACT1_END. */
const M_CONVERGE = 0.35
const M_MERGE = 0.5
const M_LINE = 0.6
const M_OPEN = 0.95

/** Segment boundaries on act 1's own 0..1 progress. */
/* The feed is the longest beat on purpose: it is the only one carrying the
   section's actual content, and four claims read as rushed under ~0.4. */
const T_PRINT_END = 0.44 // the feed finishes here; 0.44–0.46 is a hold
const T_SHIFT_START = 0.46
const T_SHIFT_END = 0.56
const T_FOLD_START = 0.56
const T_FOLD_END = 0.8
const T_PLANE_END = 0.9
const T_LID = 0.97
// The wings beat was 0.06 of a 330vh runway (~180px of scroll) — narrow enough
// to scroll straight past. 0.80–0.90 is ~330px, and it is the beat where the
// paper changes the most.
/** Where each fold ROUND ends, as a fraction of the 0.56–0.80 fold window. */
const R_CORNERS = 0.34
const R_EDGES = 0.68

/**
 * The paper after each fold. Every key is the same shape so they can be
 * interpolated element-wise:
 *
 *  - `poly`    5 points (x,y in the fold box's own 0-100 space). The flat slip
 *              duplicates its top-left corner at the apex; the final keel
 *              duplicates the apex on the left, so the left flap visibly
 *              collapses onto the spine rather than teleporting.
 *  - `creases` 3 lines as [x1,y1,x2,y2,alpha] — left diagonal, right diagonal,
 *              spine. A crease that hasn't happened yet carries alpha 0 while
 *              already sitting where it will appear, so it fades in instead of
 *              sliding in from nowhere.
 *  - `shades`  2 quads as [x0,y0..x3,y3,alpha]. Doubled paper is what reads as
 *              a fold; a crease line alone just looks like a line on a sheet.
 *
 * `sx`/`sy` are now only a ~2% settle — the press of a hand, not the fold. The
 * slip gets narrower because `poly` has handed that paper to a flap panel that
 * turned over onto it; scaling the slip down was the thing that made the old
 * version read as shrinking rather than folding.
 */
type FoldKey = {
  sx: number
  sy: number
  tilt: number
  ink: number
  poly: number[]
  creases: number[]
  shades: number[]
}

/**
 * PlaneMark's outline, normalised into its viewBox as `(x-234.12)/1347.31*100`
 * and `(y-140.02)/790.68*100`. Produced by hulling all 778 anchor + control
 * points of the component's two `<path>` elements (throwaway script, deleted)
 * and simplifying to 12 vertices: nose top-right, long swept leading edge out
 * to the left wing tip, notched tail. Spans 1.5-98.5 x, 2.5-97.5 y and fills
 * 49% of its own bounding box — a real shape, not a sliver. One vertex of the
 * hull's redundant tail cluster was traded for (46, 72), the mark's tail
 * notch, so the outline is concave there and the plane doesn't read as a blob.
 */
const PLANE_POLY = [
  1.5, 55, 1.8, 54.5, 98.2, 2.5, 98.5, 3.1, 75.2, 70.4, 66.2, 96.4,
  65.5, 97.3, 64.9, 97.5, 46, 72, 29.2, 96, 29, 95.8, 1.6, 55.8,
]
/** Every key's polygon is padded to this many vertices so the lerp works. */
const POLY_N = PLANE_POLY.length / 2

const FOLD_KEYS: FoldKey[] = [
  // 0 — flat: the printed slip
  {
    sx: 1,
    sy: 1,
    tilt: 0,
    ink: 1,
    poly: [50, 0, 100, 0, 100, 100, 100, 100, 0, 100, 0, 100, 0, 0],
    creases: [50, 0, 0, 13, 0, 50, 0, 100, 13, 0, 50, 5, 50, 100, 0],
    shades: [50, 0, 0, 13, 50, 26, 50, 0, 0, 50, 0, 100, 13, 50, 26, 50, 0, 0],
  },
  // 1 — top corners in to the centre line: the slip gets a nose
  {
    sx: 0.995,
    sy: 0.997,
    tilt: -1,
    ink: 0.75,
    poly: [50, 0, 100, 13, 100, 100, 100, 100, 0, 100, 0, 100, 0, 13],
    creases: [50, 0, 0, 13, 1, 50, 0, 100, 13, 1, 50, 5, 50, 100, 0],
    shades: [50, 0, 0, 13, 50, 26, 50, 0, 1, 50, 0, 100, 13, 50, 26, 50, 0, 1],
  },
  // 2 — the long edges fold in to meet the middle
  {
    sx: 0.99,
    sy: 0.993,
    tilt: 1,
    ink: 0.4,
    poly: [50, 0, 86, 17, 82, 100, 82, 100, 18, 100, 18, 100, 14, 17],
    creases: [50, 0, 14, 17, 1, 50, 0, 86, 17, 1, 50, 5, 50, 100, 0],
    shades: [50, 0, 14, 17, 50, 34, 50, 0, 1, 50, 0, 86, 17, 50, 34, 50, 0, 1],
  },
  // 3 — again, and the spine appears where it will fold in half
  {
    sx: 0.986,
    sy: 0.989,
    tilt: -1.5,
    ink: 0.12,
    poly: [50, 0, 74, 24, 70, 100, 70, 100, 30, 100, 30, 100, 26, 24],
    creases: [50, 0, 26, 24, 1, 50, 0, 74, 24, 1, 50, 5, 50, 100, 1],
    shades: [50, 0, 26, 24, 50, 48, 50, 0, 1, 50, 0, 74, 24, 50, 48, 50, 0, 1],
  },
  // 4 — the dart body, long and thin
  {
    sx: 0.982,
    sy: 0.985,
    tilt: 1.5,
    ink: 0,
    poly: [50, 0, 66, 31, 62, 100, 62, 100, 38, 100, 38, 100, 34, 31],
    creases: [50, 0, 34, 31, 1, 50, 0, 66, 31, 1, 50, 3, 50, 100, 1],
    shades: [50, 0, 34, 31, 50, 62, 50, 0, 1, 50, 0, 66, 31, 50, 62, 50, 0, 1],
  },
  // 5 — folded in half along the spine AND the tail folded up: `sy` drops to
  // 0.30, which is the only honest way a 1:2 receipt becomes a 1.7:1 plane.
  // Folding a long strip into a dart really does shorten the body.
  {
    sx: 0.978,
    sy: 0.3,
    tilt: 0,
    ink: 0,
    poly: [50, 0, 66, 31, 62, 100, 62, 100, 50, 100, 50, 100, 50, 0],
    creases: [50, 0, 50, 100, 1, 50, 0, 66, 31, 1, 50, 3, 50, 100, 1],
    shades: [50, 0, 50, 31, 50, 62, 50, 0, 0, 50, 0, 66, 31, 62, 100, 50, 100, 1],
  },
  // 6 — THE PLANE. Not a crossfade target: this is the paper's OWN silhouette
  // once the wings open. It is not hand-drawn — PLANE_POLY below is the convex
  // hull of every anchor and control point in PlaneMark's two paths, so the
  // paper ends up as the brand mark's actual outline. `sy` 0.288 makes the box
  // 1.70:1 (the slip is ~1:2.04, so 0.4902 / 1.704 = 0.288), matching the
  // mark's viewBox ratio 1347x791, which is why the lines overlay can sit on
  // the wings at width 100% with no rotation. Height stays ~60% of the slip's
  // pre-fold width.
  {
    sx: 1,
    sy: 0.288,
    tilt: 0,
    ink: 0,
    poly: PLANE_POLY,
    // the keel: nose to the tail notch
    creases: [98.3, 3, 75.2, 70.4, 1, 98.3, 3, 75.2, 70.4, 0, 98.3, 3, 75.2, 70.4, 0],
    shades: [98, 3, 2, 97, 44, 66, 98, 3, 0, 98, 3, 64, 51, 30, 99, 98, 3, 0],
  },
]

/**
 * Keys 0-5 are authored with 7 points because that is what the folding needs
 * to say; the plane needs 12. Padding repeats source vertices on the SAME
 * monotone index map for every key, so the authored keys still interpolate
 * among themselves exactly as written, and 5 -> 6 gets a non-crossing
 * vertex correspondence for free.
 */
const padPoly = (pts: number[]): number[] => {
  const n = pts.length / 2
  if (n === POLY_N) return pts
  const out: number[] = []
  for (let k = 0; k < POLY_N; k++) {
    const src = Math.round((k * (n - 1)) / (POLY_N - 1))
    out.push(pts[src * 2], pts[src * 2 + 1])
  }
  return out
}
/** Flattened once so a frame is a single element-wise lerp over numbers. */
const FOLD_VECS: number[][] = FOLD_KEYS.map((k) => [k.sx, k.sy, k.tilt, k.ink, ...padPoly(k.poly), ...k.creases, ...k.shades])
const V_POLY = 4
const V_CREASE = V_POLY + POLY_N * 2
const V_SHADE = V_CREASE + 15

/**
 * The two flap ROUNDS, written out rather than derived, because the crease is
 * NOT the same kind of line in each — and getting that wrong is what produced
 * the ghost triangles.
 *
 *  - Corners fold about the APEX DIAGONAL. The region is the corner quad only,
 *    stopping where the crease leaves the sheet's edge.
 *  - The long edges fold about the NEW VERTICAL EDGE, not about the apex. A
 *    receipt is 1:2; rotating a full-height strip about a shallow apex
 *    diagonal swings its bottom corner ~280px clear of the crease and its
 *    mirror lands nowhere near the paper. Folding a long strip's side in is a
 *    near-vertical crease in real life, and that is also the only version that
 *    stays inside the slip.
 *
 * The invariant to preserve if these are ever edited: **every point of a flap
 * region must mirror, about that flap's own crease, back onto the sheet.** If
 * it does, the panel can never leave the slip's box at any angle.
 */
type Round = {
  left: number[][]
  right: number[][]
  /** crease as [origin, a second point on the line], in the 0-100 fold box. */
  axisL: number[][]
  axisR: number[][]
}
const ROUNDS: Round[] = [
  // round 0 — the corners come in to the centre line (silhouette keys 0 -> 2)
  {
    left: [[50, 0], [0, 0], [0, 13], [14, 17]],
    right: [[50, 0], [100, 0], [100, 13], [86, 17]],
    axisL: [[50, 0], [14, 17]],
    axisR: [[50, 0], [86, 17]],
  },
  // round 1 — the long edges fold in (silhouette keys 2 -> 4), vertical crease
  {
    left: [[14, 17], [18, 100], [38, 100], [34, 31]],
    right: [[86, 17], [82, 100], [62, 100], [66, 31]],
    axisL: [[34, 31], [38, 100]],
    axisR: [[66, 31], [62, 100]],
  },
]
const pt = (k: number, i: number) => [FOLD_KEYS[k].poly[i * 2], FOLD_KEYS[k].poly[i * 2 + 1]]
/** Round 2 folds the slip in half: the left half of key 4, about the spine. */
const HALF_REGION: number[][] = [pt(4, 0), pt(4, 6), pt(4, 4), [50, 100], [50, 0]]
const poly = (pts: number[][]) => `polygon(${pts.map(([x, y]) => `${x}% ${y}%`).join(",")})`

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)
/** Local progress through [a,b], clamped. */
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
/** Slow in, slow out — used wherever a whole object moves rather than creases. */
const ease = (t: number) => t * t * (3 - 2 * t)

export function FoldReceipt() {
  const reduced = useSafeReducedMotion()
  // Client-only: the server must render the finished frame (see the header).
  const [pinned, setPinned] = useState(false)
  // "idle" until the first frame: `done` here would put .frBinLanded on the
  // bin at mount and fire the lid keyframe on page load.
  const [phase, setPhase] = useState<Phase>("idle")

  const runwayRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const rigRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const foldRef = useRef<HTMLDivElement>(null)
  const inkRef = useRef<HTMLDivElement>(null)
  const planeRef = useRef<HTMLSpanElement>(null)
  const binRef = useRef<HTMLDivElement>(null)
  const lapRef = useRef<HTMLDivElement>(null)
  const slabRef = useRef<HTMLDivElement>(null)
  const deckRef = useRef<HTMLDivElement>(null)
  const lidRef = useRef<HTMLDivElement>(null)
  const printerRef = useRef<HTMLDivElement>(null)
  const creaseRefs = useRef<(SVGLineElement | null)[]>([])
  const shadeRefs = useRef<(SVGPolygonElement | null)[]>([])
  // Three flap panels, never more: [0] and [1] are the left/right flaps and are
  // REUSED by both the corner round and the edge round (once a flap has landed
  // its paper is represented by the shade quad above, so the element is free);
  // halfRef is the fold-in-half, which then opens back out into the wing.
  const flapRefs = useRef<(HTMLDivElement | null)[]>([])
  const flapFaceRefs = useRef<(HTMLDivElement | null)[]>([])
  const flapShadeRefs = useRef<(HTMLSpanElement | null)[]>([])
  const halfRef = useRef<HTMLDivElement>(null)
  const halfFaceRef = useRef<HTMLDivElement>(null)

  const rafRef = useRef<number | null>(null)
  const phaseRef = useRef<Phase>("idle")
  /** The slip's natural height in px — what "fully fed" means, measured. */
  const sheetH = useRef(0)

  // `useSafeReducedMotion` answers `false` until hydration, so this can flip
  // back off one tick in — the cleanup below puts the resting frame back.
  useEffect(() => {
    setPinned(!reduced)
  }, [reduced])

  useEffect(() => {
    if (!pinned) return

    // Copied out of the refs so the cleanup below is addressing the same
    // nodes this effect drove (react-hooks/exhaustive-deps).
    const shadowEl = shadowRef.current
    const rig = rigRef.current
    const binEl = binRef.current
    const paperEl = paperRef.current
    const foldEl = foldRef.current
    const inkEl = inkRef.current
    const planeEl = planeRef.current
    const lapEl = lapRef.current
    const printerEl = printerRef.current

    const measure = () => {
      sheetH.current = sheetRef.current?.offsetHeight ?? 0
    }

    const setPhaseOnce = (next: Phase) => {
      if (phaseRef.current === next) return
      phaseRef.current = next
      setPhase(next)
    }

    /**
     * Every DOM write in the scene goes through these two, which drop any
     * write whose value has not changed since the last frame. Most of a frame
     * is constants — a flap's clip region and crease origin do not move within
     * a round, the feed height stops changing once the slip is printed — and
     * touching `style` at all costs a style recalc even when the value is
     * identical. Per-frame writes in the fold: 46 before, 12-19 after.
     */
    const last = new Map<string, string>()
    const set = (el: HTMLElement | SVGElement | null | undefined, prop: string, val: string, key: string) => {
      if (!el || last.get(key) === val) return
      last.set(key, val)
      el.style.setProperty(prop, val)
    }
    const attr = (el: Element | null | undefined, name: string, val: string, key: string) => {
      if (!el || last.get(key) === val) return
      last.set(key, val)
      el.setAttribute(name, val)
    }
    let creasesLive = true

    /** One frame. Pure function of `p`; writes DOM, never state (bar phase). */
    const draw = (p: number) => {
      const scene = sceneRef.current
      const paper = paperRef.current
      const fold = foldRef.current
      const plane = planeRef.current
      if (!scene || !paper || !fold || !plane) return
      const cq = scene.clientWidth / 100
      // Act 1's own progress. Everything from here to the flight reads `q`;
      // only the laptop act below reads the raw `p`.
      const q = clamp01(p / ACT1_END)

      // --- 1. the feed. --feed-h lives on .frPaper so the shadow shares it.
      const print = ease(seg(q, 0, T_PRINT_END))
      set(paper, "--feed-h", `${(sheetH.current * print).toFixed(1)}px`, "feed")

      // --- 2. shift left + bin in ----------------------------------------
      const shift = ease(seg(q, T_SHIFT_START, T_SHIFT_END))
      set(binEl, "--bin-t", shift.toFixed(4), "bin")

      // --- 3. the fold: three ROUNDS of real flaps turning over -----------
      // The silhouette below is the paper that is still FLAT. Each round hands
      // a strip on each side to a flap panel, which turns 180 degrees about
      // the crease and lands on the middle as blank paper. Round 2 folds the
      // whole thing in half; 0.80-0.90 then opens the wings into the mark.
      const fRaw = seg(q, T_FOLD_START, T_FOLD_END)
      const wings = ease(seg(q, T_FOLD_END, T_PLANE_END))
      let keyPos: number
      let activeRound: number
      let rt: number
      if (q >= T_FOLD_END) {
        keyPos = 5 + wings
        activeRound = 3
        rt = 1
      } else if (fRaw < R_CORNERS) {
        rt = fRaw / R_CORNERS
        keyPos = rt * 2
        activeRound = 0
      } else if (fRaw < R_EDGES) {
        rt = (fRaw - R_CORNERS) / (R_EDGES - R_CORNERS)
        keyPos = 2 + rt * 2
        activeRound = 1
      } else {
        rt = (fRaw - R_EDGES) / (1 - R_EDGES)
        keyPos = 4 + rt
        activeRound = 2
      }

      const i = Math.min(FOLD_VECS.length - 2, Math.floor(keyPos))
      const t = keyPos - i
      const a = FOLD_VECS[i]
      const b = FOLD_VECS[i + 1]
      const v = (n: number) => a[n] + (b[n] - a[n]) * t

      let d = ""
      for (let n = 0; n < POLY_N; n++) d += `${n ? "," : ""}${v(V_POLY + n * 2).toFixed(2)}% ${v(V_POLY + n * 2 + 1).toFixed(2)}%`
      set(fold, "clip-path", `polygon(${d})`, "foldClip")
      // The dart leans into its dihedral as the wings open — a rotateY about
      // the spine (transform-origin x is 50%). clip-path flattens this
      // element's CHILDREN, but the element itself is still placed in
      // .frPaper's 3D space, so the lean is real.
      set(
        fold,
        "transform",
        `scale(${v(0).toFixed(4)}) scaleY(${v(1).toFixed(4)}) rotate(${v(2).toFixed(3)}deg) rotateY(${(-16 * wings).toFixed(2)}deg)`,
        "foldT",
      )
      set(fold, "opacity", "1", "foldO")
      // Not just transparent: HIDDEN. Past key 4 the ink is 0, and an
      // invisible-but-painted receipt (text, rules, the barcode's repeating
      // gradient) still re-rasterises on every scale change of .frFold.
      const inkA = v(3)
      set(inkEl, "opacity", inkA.toFixed(3), "ink")
      set(inkEl, "visibility", inkA > 0.002 ? "visible" : "hidden", "inkV")
      // The contact shadow is a rectangle: it is honest during the feed and
      // meaningless once the paper stops being a rectangle, so it leaves.
      set(shadowEl, "opacity", (1 - seg(q, T_FOLD_START, T_FOLD_START + 0.05)).toFixed(3), "shadowO")

      // Creases and shades are drawn in the fold box's 0-100 space, which at
      // key 6 is squashed to sy .288 and rotated — a hairline can end up
      // outside the plane's silhouette. They have no job left once the wings
      // start opening, so they are gone by p = 0.80 and skipped entirely
      // after that: 21 of the frame's writes simply stop happening.
      const creaseOut = 1 - clamp01((q - 0.76) / 0.04)
      if (creaseOut > 0) {
        creasesLive = true
        for (let n = 0; n < 3; n++) {
          const line = creaseRefs.current[n]
          const o = V_CREASE + n * 5
          const alpha = v(o + 4) * creaseOut
          set(line, "opacity", alpha.toFixed(3), `cO${n}`)
          if (alpha <= 0) continue // an invisible crease's geometry is free
          attr(line, "x1", v(o).toFixed(2), `cx1${n}`)
          attr(line, "y1", v(o + 1).toFixed(2), `cy1${n}`)
          attr(line, "x2", v(o + 2).toFixed(2), `cx2${n}`)
          attr(line, "y2", v(o + 3).toFixed(2), `cy2${n}`)
        }
        for (let n = 0; n < 2; n++) {
          const shade = shadeRefs.current[n]
          const o = V_SHADE + n * 9
          const alpha = v(o + 8) * creaseOut
          set(shade, "opacity", alpha.toFixed(3), `sO${n}`)
          if (alpha <= 0) continue
          let pts = ""
          for (let k = 0; k < 4; k++) pts += `${k ? " " : ""}${v(o + k * 2).toFixed(2)},${v(o + k * 2 + 1).toFixed(2)}`
          attr(shade, "points", pts, `sP${n}`)
        }
      } else if (creasesLive) {
        creasesLive = false
        for (let n = 0; n < 3; n++) set(creaseRefs.current[n], "opacity", "0", `cO${n}`)
        for (let n = 0; n < 2; n++) set(shadeRefs.current[n], "opacity", "0", `sO${n}`)
      }

      // --- 3b. the flap panels ---------------------------------------------
      // rotate3d's axis is read in the element's own PIXEL space, so the crease
      // direction has to be built from the live box, not from percentages.
      const boxW = paper.offsetWidth
      const boxH = fold.offsetHeight || 1
      const side = ROUNDS[activeRound] // undefined on rounds 2/3 — flaps idle
      for (let n = 0; n < 2; n++) {
        const flap = flapRefs.current[n]
        const face = flapFaceRefs.current[n]
        if (!flap || !face) continue
        if (!side) {
          set(flap, "opacity", "0", `fO${n}`)
          continue
        }
        const axis = n === 0 ? side.axisL : side.axisR
        const region = n === 0 ? side.left : side.right
        const [[ox, oy], [tx2, ty2]] = axis
        // NEGATED on purpose. With the axis this way the flap swings AWAY
        // from the camera for the first 90 degrees, so `perspective` only ever
        // foreshortens it (scale = d / (d + |z|) <= 1). The un-negated axis
        // swung it toward the eye, where scale = d / (d - |z|) magnified the
        // panel mid-turn — half of the ghost triangles.
        const ax = -((tx2 - ox) / 100) * boxW
        const ay = -((ty2 - oy) / 100) * boxH
        const ang = 180 * ease(rt)
        // constant within a round: written once, at the round boundary
        set(face, "clip-path", poly(region), `fC${n}`)
        set(flap, "transform-origin", `${ox}% ${oy}%`, `fTO${n}`)
        set(flap, "transform", `translateZ(1px) rotate3d(${ax.toFixed(2)}, ${ay.toFixed(2)}, 0, ${ang.toFixed(2)}deg)`, `fT${n}`)
        // Solid while it turns: a see-through flap reads as a ghost, not as
        // paper. Only the shade below fades.
        set(flap, "opacity", (clamp01(rt * 40) * clamp01((1 - rt) * 40)).toFixed(3), `fO${n}`)
        // A flap is BLANK paper. It used to carry a clipped copy of the whole
        // slip — barcode gradient and all — which meant two extra full receipt
        // subtrees repainting inside a 3D-transforming layer every frame. That
        // was the last of the lag. A fold hides what it folds over either way.
        set(flapShadeRefs.current[n], "opacity", (0.2 * Math.sin(Math.PI * rt)).toFixed(3), `fS${n}`)
      }

      // --- 3c. the half-fold, then the wings opening ------------------------
      const half = halfRef.current
      if (half && halfFaceRef.current) {
        set(halfFaceRef.current, "clip-path", poly(HALF_REGION), "hC")
        set(half, "transform-origin", "50% 50%", "hTO")
        if (activeRound === 2) {
          set(half, "opacity", clamp01(rt * 22).toFixed(3), "hO")
          set(half, "transform", `translateZ(1px) rotateY(${(180 * ease(rt)).toFixed(2)}deg)`, "hT")
        } else if (activeRound === 3) {
          // the wing swings back OUT to the plane's dihedral and hands its
          // paper to the silhouette, which is running 5 -> 6 underneath it
          set(half, "opacity", (1 - clamp01(wings / 0.5)).toFixed(3), "hO")
          set(half, "transform", `translateZ(1px) rotateY(${(180 - 145 * wings).toFixed(2)}deg)`, "hT")
        } else {
          set(half, "opacity", "0", "hO")
        }
      }

      // --- 4. the paper IS the plane ----------------------------------------
      // No object crossfade: the folded paper flies. The brand mark's circuit
      // lines (body transparent) come in DURING the wings beat, so by p = 0.90
      // the shape already reads as the mark rather than as a white wedge.
      set(plane, "opacity", (clamp01((q - 0.83) / 0.06) * 0.7).toFixed(3), "planeO")

      // --- 5. the flight ----------------------------------------------------
      // A plane does not tumble like a ball: it climbs, then noses over into
      // the mouth of the bin. The target is measured from layout boxes
      // (offset*, which transforms can't pollute) rather than guessed.
      const fly = seg(q, T_PLANE_END, 1)
      const launch = -14 * wings
      if (fly <= 0) {
        set(paper, "transform", wings > 0 ? `rotate(${launch.toFixed(2)}deg)` : "none", "paperT")
        set(paper, "opacity", "1", "paperO")
      } else {
        const bin = binRef.current
        // The rig is `inset: 0` inside the scene, so its UNtransformed left is
        // the scene's left — the difference is exactly how far it has shifted.
        const rigShift = rig ? rig.getBoundingClientRect().left - scene.getBoundingClientRect().left : 0
        const px = paper.offsetLeft + paper.offsetWidth / 2 + rigShift
        const py = paper.offsetTop + paper.offsetHeight / 2
        const bx = bin ? bin.offsetLeft + bin.offsetWidth / 2 : px
        const by = bin ? bin.offsetTop + bin.offsetHeight * 0.26 : py
        const tx = (bx - px) * ease(fly)
        const ty = (by - py) * fly * fly - Math.sin(Math.PI * fly) * 9 * cq
        set(
          paper,
          "transform",
          `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) rotate(${(launch + 78 * fly).toFixed(2)}deg) scale(${(1 - 0.58 * fly).toFixed(3)})`,
          "paperT",
        )
        set(paper, "opacity", clamp01((1 - fly) / 0.12).toFixed(3), "paperO")
      }

      // --- 6. ACT 2: the two objects become one, and the one becomes a laptop
      // Converge (printer back to centre and down, bin left and up), merge
      // into a navy slab, squash the slab to a line, then hinge the lid up to
      // reveal the dashboard. `--rig-t` simply runs back to 0, which is the
      // same journey the printer made on the way out, in reverse.
      const m = seg(p, ACT1_END, 1)
      const c = seg(m, 0, M_CONVERGE)
      const conv = ease(c)
      const mrg = ease(seg(m, M_CONVERGE, M_MERGE))
      const line = ease(seg(m, M_MERGE, M_LINE))
      const open = ease(seg(m, M_LINE, M_OPEN))
      set(rig, "--rig-t", (shift * (1 - conv)).toFixed(4), "rig")
      // Two objects gliding together, not one falling: the printer takes the
      // shallow end of the arc (x eased, y quadratic so it leaves slowly), the
      // bin the other (y eased out), and both shrink to 0.6 on the way in.
      set(printerEl, "--pr-x", `${(-8 * conv).toFixed(2)}cqw`, "prX")
      set(printerEl, "--pr-y", `${(52 * c * c).toFixed(2)}cqw`, "prY")
      set(printerEl, "--pr-s", (1 - 0.4 * conv).toFixed(4), "prS")
      set(printerEl, "opacity", (1 - mrg).toFixed(3), "prO")
      set(binEl, "--bin-x", `${(-38 * conv).toFixed(2)}cqw`, "binX")
      set(binEl, "--bin-y", `${(-10.4 * (1 - (1 - c) * (1 - c))).toFixed(2)}cqw`, "binY")
      set(binEl, "--bin-s", (1 - 0.4 * conv).toFixed(4), "binS")
      set(binEl, "--bin-o", (1 - mrg).toFixed(3), "binO")
      // NOTHING of the laptop paints before the merge. A lid at rotateX(-90)
      // is edge-on, which is not invisible — it is a 1px line the full width
      // of the lid, which is exactly the hairline that showed up at p 0.80.
      const lapOn = m >= M_CONVERGE
      set(lapEl, "--lap-o", lapOn ? "1" : "0", "lapO")
      set(lapEl, "visibility", lapOn ? "visible" : "hidden", "lapV")
      set(lidRef.current, "visibility", open > 0.001 ? "visible" : "hidden", "lidV")
      set(lidRef.current, "--lid", `${(-90 + 90 * open).toFixed(2)}deg`, "lid")
      // The slab merges, then hands over to the deck at exactly its own width,
      // so the crossfade has no edge: same box, one fades out as one fades in.
      const w = `${(26 + 14 * mrg + 32 * line).toFixed(2)}cqw`
      set(slabRef.current, "--slab-w", w, "slabW")
      set(slabRef.current, "--slab-h", `${(22 - 10 * mrg - 11.2 * line).toFixed(2)}cqw`, "slabH")
      set(slabRef.current, "--slab-o", (mrg * (1 - line)).toFixed(3), "slabO")
      set(deckRef.current, "--deck-w", w, "deckW")
      // the line thickens into a real deck as the lid rises
      set(deckRef.current, "--deck-h", `${(0.8 + 2.2 * open).toFixed(2)}cqw`, "deckH")
      set(deckRef.current, "--deck-o", line.toFixed(3), "deckO")

      setPhaseOnce(
        m >= M_LINE
          ? "dash"
          : m > 0
          ? "merge"
          : q >= T_LID
          ? "done"
          : q >= T_PLANE_END
            ? "fly"
            : q >= T_FOLD_END
              ? "plane"
              : q >= T_FOLD_START
                ? "fold"
                : q >= T_SHIFT_START
                  ? "shift"
                  : "print",
      )
    }

    const update = () => {
      rafRef.current = null
      const runway = runwayRef.current
      if (!runway) return
      const rect = runway.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      draw(total > 0 ? clamp01(-rect.top / total) : 0)
    }
    const onScroll = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(update)
    }
    const onResize = () => {
      measure()
      onScroll()
    }

    measure()
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)
    // The scene for width (every furniture size is a cqw of it), and the sheet
    // itself because "fully fed" is its measured height — which moves when the
    // mono font finishes loading, long after any scroll or resize event.
    const ro = new ResizeObserver(onResize)
    if (sceneRef.current) ro.observe(sceneRef.current)
    if (sheetRef.current) ro.observe(sheetRef.current)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      ro.disconnect()
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      // Hand the resting frame back: every value above is an INLINE style, so
      // unpinning (reduced motion arriving a tick after hydration) has to
      // clear them one by one, or the visitor is left with a slip of height 0
      // and a plane sitting on top of it. Properties, not removeAttribute:
      // the plane's `opacity: 0` comes from JSX and must survive.
      paperEl?.style.removeProperty("--feed-h")
      shadowEl?.style.removeProperty("opacity")
      rig?.style.removeProperty("--rig-t")
      binEl?.style.removeProperty("--bin-t")
      for (const prop of ["transform", "opacity"]) {
        paperEl?.style.removeProperty(prop)
        foldEl?.style.removeProperty(prop)
        planeEl?.style.removeProperty(prop)
      }
      foldEl?.style.removeProperty("clip-path")
      inkEl?.style.removeProperty("opacity")
      if (planeEl) planeEl.style.opacity = "0"
    }
  }, [pinned])

  return (
    <div
      ref={runwayRef}
      className={styles.frRunway}
      style={pinned ? { height: `${RUNWAY_VH}vh` } : undefined}
    >
      <div className={cn(styles.frPin, pinned && styles.frPinSticky)}>
        <div className={styles.frStage}>
          <div className={styles.frScene} ref={sceneRef}>
            <span aria-hidden="true" className={styles.frGround} />

            {/* printer + slip travel together: the rig is what shifts left. */}
            <div className={styles.frRig} ref={rigRef}>
              <Printer busy={phase === "print"} ref={printerRef} />

              <div ref={paperRef} className={styles.frPaper}>
                {/* The flat paper that is LEFT. Its silhouette narrows because
                    the flaps below have taken that paper away, not because it
                    is being scaled down. */}
                {/* A plain box-shadow that only ever changes height and
                    opacity. It is a SIBLING of the fold box, and empty, so no
                    filter is ever rasterised against a changing silhouette. */}
                <span aria-hidden="true" className={styles.frShadow} ref={shadowRef} />

                <div className={styles.frFold} ref={foldRef}>
                  {/* The feed mask wears the torn tear-off edge, so the torn
                      edge LEADS the paper out of the slot and ends up as the
                      finished slip's bottom. Its height is --feed-h, the
                      measured slip height times the print fraction, inherited
                      from .frPaper so the shadow shares the one value. */}
                  <div className={styles.frFeed}>
                    <div className={styles.frSheet} ref={sheetRef}>
                      <div className={styles.frInk} ref={inkRef}>
                        <SlipBody />
                      </div>
                    </div>
                  </div>

                  {/* drawn in the fold box's own coordinates, so every crease
                      lands exactly on a clip-path edge rather than near one */}
                  <svg
                    aria-hidden="true"
                    className={styles.frCreases}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    focusable="false"
                  >
                    {[0, 1].map((n) => (
                      <polygon
                        key={`shade-${n}`}
                        ref={(el) => {
                          shadeRefs.current[n] = el
                        }}
                        points="50,0 50,0 50,0 50,0"
                        style={{ opacity: 0 }}
                      />
                    ))}
                    {[0, 1, 2].map((n) => (
                      <line
                        key={`crease-${n}`}
                        ref={(el) => {
                          creaseRefs.current[n] = el
                        }}
                        x1="50"
                        y1="0"
                        x2="50"
                        y2="0"
                        style={{ opacity: 0 }}
                      />
                    ))}
                  </svg>
                </div>

                {/* The flaps. Client-only, so the server HTML still contains
                    exactly ONE copy of the four claims. The 3D rotate is on
                    the panel and the clip is on its child: clip-path and a 3D
                    transform on the same element flattens the element. */}
                {pinned && (
                  <>
                    {[0, 1].map((n) => (
                      <div
                        key={`flap-${n}`}
                        aria-hidden="true"
                        className={styles.frFlap}
                        ref={(el) => {
                          flapRefs.current[n] = el
                        }}
                        style={{ opacity: 0 }}
                      >
                        <div
                          className={styles.frFlapFace}
                          ref={(el) => {
                            flapFaceRefs.current[n] = el
                          }}
                        >
                          <span
                            className={styles.frFlapShade}
                            ref={(el) => {
                              flapShadeRefs.current[n] = el
                            }}
                            style={{ opacity: 0 }}
                          />
                        </div>
                      </div>
                    ))}

                    {/* the fold in half, which then opens back out as the wing */}
                    <div aria-hidden="true" className={styles.frFlap} ref={halfRef} style={{ opacity: 0 }}>
                      <div className={styles.frFlapFace} ref={halfFaceRef}>
                        <span className={styles.frFlapShade} style={{ opacity: 0.2 }} />
                      </div>
                    </div>
                  </>
                )}

                {/* The brand mark, BODY TRANSPARENT: only its circuit lines,
                    settling over the opened wings. The flying object stays the
                    folded paper — there is no object crossfade, so the
                    silhouette can never mismatch. */}
                <span ref={planeRef} className={styles.frPlane} style={{ opacity: 0 }}>
                  <PlaneMark body="transparent" lines="rgba(27, 36, 46, 0.5)" size={100} />
                </span>
              </div>
            </div>

            <Bin ref={binRef} landed={phase === "done"} />

            {/* ACT 2. Rendered on the server so the dashboard screenshot is in
                the HTML, but `--lap-o` defaults to 0 and the element defaults
                to `visibility: hidden` — so a no-JS or reduced-motion visitor
                keeps the slip-and-bin frame and never sees a laptop. */}
            <div className={styles.frLaptop} ref={lapRef}>
              <div aria-hidden="true" className={styles.frSlab} ref={slabRef} />
              <div className={styles.frLid} ref={lidRef}>
                <Image
                  src="/product/merchant-dashboard.png"
                  alt="The PapeX merchant dashboard"
                  width={2880}
                  height={1800}
                  sizes="70vw"
                  className={styles.frScreen}
                />
              </div>
              {/* the deck: a trapezoid seen in slight perspective, wider at
                  the front edge, with the lid hinged on its BACK edge */}
              <div aria-hidden="true" className={styles.frDeck} ref={deckRef}>
                <span className={styles.frKeys} />
                <span className={styles.frPad} />
              </div>
            </div>
          </div>

          {pinned && (
            <p className={styles.frHint}>
              {phase === "print" && "Printing your reasons…"}
              {phase === "shift" && "Four reasons. Nothing to sign."}
              {(phase === "fold" || phase === "plane") && "Keep scrolling — the paper folds away"}
              {phase === "fly" && "Gone."}
              {phase === "done" && "That is the switch. No more paper."}
              {phase === "merge" && "Everything it printed has to go somewhere."}
              {phase === "dash" && "And a dashboard for every receipt."}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/** The printed face. Rendered once in the slip and once per flap panel — the
 *  flap copies are client-only and aria-hidden, so the document still has
 *  exactly one readable copy of the four claims. */
function SlipBody() {
  return (
    <>
      <div className={styles.frBlock}>
        <div className={styles.frSlipHead}>PAPEX</div>
        <div className={styles.frRule} />
        <div className={styles.frSlipSub}>REASONS TO SWITCH</div>
      </div>

      {whyMerchants.cards.map((card) => (
        <div key={card.value} className={cn(styles.frBlock, styles.frItem)}>
          <span className={styles.frItemLabel}>{card.title}</span>
          <span className={styles.frItemValue}>{card.value}</span>
        </div>
      ))}

      <div className={styles.frBlock}>
        <div className={styles.frRule} />
        <div className={cn(styles.frItem, styles.frTotal)}>
          <span>TOTAL</span>
          <span>4</span>
        </div>
        <div className={styles.frSlipFoot}>NONE TO SAY NO</div>
        <div aria-hidden="true" className={styles.frBarcode} />
      </div>
    </>
  )
}

function Printer({ busy, ref }: { busy: boolean; ref: React.Ref<HTMLDivElement> }) {
  return (
    <div className={cn(styles.frPrinter, busy && styles.frPrinterBusy)} ref={ref}>
      <svg viewBox="0 0 260 150" className={styles.frPrinterSvg} aria-hidden="true">
        <defs>
          <linearGradient id="fr-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3A4753" />
            <stop offset="1" stopColor="#1B242E" />
          </linearGradient>
          <linearGradient id="fr-lid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#55636F" />
            <stop offset="1" stopColor="#2C3742" />
          </linearGradient>
        </defs>
        <ellipse cx="130" cy="132" rx="106" ry="9" fill="#00121D" opacity="0.14" />
        {/* paper roll hump on top, then the body, then the front bezel */}
        <rect x="48" y="6" width="164" height="34" rx="17" fill="url(#fr-lid)" />
        <rect x="70" y="14" width="120" height="9" rx="4.5" fill="#0C141C" opacity="0.45" />
        <rect x="18" y="34" width="224" height="90" rx="16" fill="url(#fr-body)" />
        <rect x="18" y="34" width="224" height="30" rx="16" fill="#FFFFFF" opacity="0.05" />
        {/* front bezel carrying the tear-off slot at the bottom edge */}
        <rect x="34" y="92" width="192" height="32" rx="12" fill="#141C24" />
        <rect x="52" y="112" width="156" height="9" rx="4.5" fill="#02070C" />
        <rect x="52" y="112" width="156" height="3" rx="1.5" fill="#000" opacity="0.65" />
        <circle cx="214" cy="78" r="6" className={styles.frLed} />
        <rect x="44" y="72" width="54" height="6" rx="3" fill="#FFFFFF" opacity="0.09" />
      </svg>
    </div>
  )
}

function Bin({ ref, landed }: { ref: React.Ref<HTMLDivElement>; landed: boolean }) {
  return (
    <div className={cn(styles.frBin, landed && styles.frBinLanded)} ref={ref}>
      <svg viewBox="0 0 140 170" className={styles.frBinSvg} aria-hidden="true">
        <ellipse cx="70" cy="162" rx="52" ry="7" fill="#00121D" opacity="0.16" />
        <g className={styles.frBinLid}>
          <rect x="12" y="26" width="116" height="14" rx="7" fill="#37424E" />
          <rect x="56" y="16" width="28" height="10" rx="5" fill="#37424E" />
        </g>
        <path d="M22 44H118L108 156A8 8 0 0 1 100 163H40A8 8 0 0 1 32 156Z" fill="#46525F" />
        <path d="M22 44H70V163H40A8 8 0 0 1 32 156Z" fill="#FFFFFF" opacity="0.06" />
        <path d="M48 60V148M70 60V148M92 60V148" stroke="#00121D" strokeOpacity="0.22" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  )
}
