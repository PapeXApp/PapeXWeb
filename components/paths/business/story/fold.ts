// The paper-airplane fold, as data. Ported unchanged from the 2026-09-22
// FoldReceipt.tsx (see code/.claude/plans/2026-09-22-business-receipt-scroll-fold.md
// for why every key is the same shape and why the flap rounds are written out):
// only the exports are new. story/RetainStory.tsx drives it on a shorter clock.

export type FoldKey = {
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
export const PLANE_POLY = [
  1.5, 55, 1.8, 54.5, 98.2, 2.5, 98.5, 3.1, 75.2, 70.4, 66.2, 96.4,
  65.5, 97.3, 64.9, 97.5, 46, 72, 29.2, 96, 29, 95.8, 1.6, 55.8,
]
/** Every key's polygon is padded to this many vertices so the lerp works. */
export const POLY_N = PLANE_POLY.length / 2

export const FOLD_KEYS: FoldKey[] = [
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
export const FOLD_VECS: number[][] = FOLD_KEYS.map((k) => [k.sx, k.sy, k.tilt, k.ink, ...padPoly(k.poly), ...k.creases, ...k.shades])
export const V_POLY = 4
export const V_CREASE = V_POLY + POLY_N * 2
export const V_SHADE = V_CREASE + 15

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
export type Round = {
  left: number[][]
  right: number[][]
  /** crease as [origin, a second point on the line], in the 0-100 fold box. */
  axisL: number[][]
  axisR: number[][]
}
export const ROUNDS: Round[] = [
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
export const HALF_REGION: number[][] = [pt(4, 0), pt(4, 6), pt(4, 4), [50, 100], [50, 0]]
export const poly = (pts: number[][]) => `polygon(${pts.map(([x, y]) => `${x}% ${y}%`).join(",")})`

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)
/** Local progress through [a,b], clamped. */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
/** Slow in, slow out — used wherever a whole object moves rather than creases. */
export const ease = (t: number) => t * t * (3 - 2 * t)


/**
 * A crease as a thin quad, for `clip-path: polygon(...)` in the fold box's
 * 0-100 space. The 2026-09-22 scene drew creases as SVG <line>s and moved them
 * with attribute writes every frame; a clip-path write is the only kind of
 * per-frame write this scene allows besides transform and opacity.
 */
export const lineQuad = (x1: number, y1: number, x2: number, y2: number, w = 0.35) => {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = (-dy / len) * w
  const ny = (dx / len) * w
  const f = (n: number) => n.toFixed(2)
  return `polygon(${f(x1 + nx)}% ${f(y1 + ny)}%,${f(x2 + nx)}% ${f(y2 + ny)}%,${f(x2 - nx)}% ${f(y2 - ny)}%,${f(x1 - nx)}% ${f(y1 - ny)}%)`
}
