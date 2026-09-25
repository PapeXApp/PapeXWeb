"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { clamp01, ease, seg } from "../story/fold"
import { SetupIllustration } from "./Illustrations"
import s from "./setup.module.css"

/**
 * §05 "How do I get it?" — the five install steps as a pinned, scroll-driven
 * horizontal timeline (Web 2.1 W3, Nico's brief 2026-09-24). Same machinery
 * as story/RetainStory.tsx: a tall runway, a `position: sticky` 100svh pin,
 * and ONE progress value `p` (0..1 over the runway) from which every frame is
 * a pure function, so scrolling up plays it backwards and any `p` always
 * draws the same frame.
 *
 *   approach   as the section scrolls in, step 1's art draws in
 *   0.05-0.72  TRAVEL  the chain moves left one step per leg (four legs,
 *                      each a move then a short hold); each arriving step
 *                      draws its art and raises its text; the orange fill
 *                      tip stays on the step in front of you
 *   0.76-0.93  ZOOM    the whole timeline shrinks back to the overview —
 *                      all five in a row (a stacked list on phones)
 *   0.93-1.00  hold, then the pin releases into the demo form
 *
 * How the zoom lands exactly: CSS lays out ONLY the overview (setup.module.css).
 * measure() reads each step's art/node/text boxes once, computes where each
 * part sits in the zoomed-in travel pose, and the frame lerps a
 * translate+scale between the two. Overview = transform none, so the final
 * frame is the real layout, pixel-true, and text there renders at its own size.
 *
 * Perf contract (RetainStory's): the frame WRITES only transform, opacity and
 * stroke-dashoffset (through a change cache) and READS nothing from layout;
 * measure() runs on mount, resize and font load only.
 *
 * Accessibility: the steps are one real <ol> in DOM order; art, the dots and
 * the minute axis are aria-hidden. Reduced motion, a screen too short to pin,
 * and the server render all get the overview as a static layout.
 */

/** Scroll budget for the scene, in viewport heights, after the 100vh pin. */
const SCROLL_VH = 280
const RUNWAY_VH = 100 + SCROLL_VH
/** Beats on p. */
const TRAVEL_A = 0.05
const TRAVEL_B = 0.72
const ZOOM_A = 0.76
const ZOOM_B = 0.93
/** Each travel leg moves over this share of its span, then holds. */
const LEG_MOVE = 0.68
/** Opacity a passed step settles to while travelling on desktop (full again in the zoom). */
const PAST_DIM = 0.3
/** How far below its spot a step's text starts as it arrives (px). */
const TEXT_RISE = 16
/** A travel pose squeezed below this share of its intended size isn't worth pinning. */
const MIN_FIT = 0.72

export type SetupStep = { number: string; title: string; body: string }

type Box = { x: number; y: number; w: number; h: number }

/** Offset of `el` inside `root`, from layout boxes (transforms don't count). */
function offsetIn(el: HTMLElement, root: HTMLElement): Box {
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

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function SetupTimeline({
  header,
  steps,
  axisStart,
  axisEnd,
  nextLabel,
  nextHref,
}: {
  header: ReactNode
  steps: readonly SetupStep[]
  axisStart: string
  axisEnd: string
  nextLabel: string
  nextHref: string
}) {
  // "ssr": the server render and first client frame carry BOTH versions and
  // CSS shows one (setup.module.css: the runway unless prefers-reduced-motion,
  // then the static overview). The runway's height is inline, so the section
  // is its final height from the first paint and never grows at hydration —
  // #demo / #faq deep links land true. After mount JS keeps only one:
  // "scene", or "static" for reduced motion and screens too short to pin.
  // (Same contract as intro/IntroScene.tsx.)
  const [reduced, setReduced] = useState<boolean | null>(null)
  // `short` flips to true when the screen can't hold the pinned scene (see measure()).
  const [short, setShort] = useState(false)
  const mode: "ssr" | "scene" | "static" = reduced === null ? "ssr" : reduced || short ? "static" : "scene"
  const pinned = mode === "scene"

  const runwayRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const trackRef = useRef<HTMLSpanElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)
  const illRefs = useRef<(HTMLDivElement | null)[]>([])
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([])
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([])
  const dotFillRefs = useRef<(HTMLSpanElement | null)[]>([])
  const txtRefs = useRef<(HTMLDivElement | null)[]>([])
  const bodyRefs = useRef<(HTMLParagraphElement | null)[]>([])
  const endUpRef = useRef<HTMLSpanElement>(null)
  const endDownRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  // A short screen that grows (rotate, resize) gets the scene back.
  useEffect(() => {
    if (!short) return
    const tooShortAt = window.innerHeight
    const onResize = () => {
      if (window.innerHeight > tooShortAt + 40) setShort(false)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [short])

  useEffect(() => {
    if (!pinned) return
    const stage = stageRef.current
    const list = listRef.current
    const runway = runwayRef.current
    if (!stage || !list || !runway) return
    const N = steps.length

    // Collected ONCE: each step's drawable strokes and fading fills.
    const draws = illRefs.current.map((el) => Array.from(el?.querySelectorAll<SVGPathElement>("[data-d]") ?? []))
    const fades = illRefs.current.map((el) => Array.from(el?.querySelectorAll<SVGPathElement>("[data-f]") ?? []))

    /** Everything the frame needs, in px. Rebuilt by measure() only. */
    const M = {
      P: 1,
      phone: false,
      runTop: 0,
      runTotal: 0,
      vh: 1,
      // per step, travel pose relative to the overview box, before the camera
      ill: [] as { tx: number; ty: number; s: number }[],
      node: [] as { tx: number; ty: number }[],
      txt: [] as { tx: number; ty: number; s: number }[],
      // the line's two ends: travel (before camera) and overview
      tA: [0, 0],
      tB: [0, 0],
      oA: [0, 0],
      oB: [0, 0],
    }

    const num = (cs: CSSStyleDeclaration, name: string, fallback: number) => {
      const v = parseFloat(cs.getPropertyValue(name))
      return Number.isFinite(v) ? v : fallback
    }

    /** Returns false when the screen can't hold the scene. */
    const measure = (): boolean => {
      M.runTop = runway.getBoundingClientRect().top + window.scrollY
      M.runTotal = runway.offsetHeight - window.innerHeight
      M.vh = window.innerHeight || 1
      const W = stage.clientWidth
      const H = stage.clientHeight
      const cs = getComputedStyle(stage)
      M.phone = num(cs, "--t-phone", 0) > 0
      const P = W * num(cs, "--t-pitch", 0.6) + num(cs, "--t-pitch-add", 0)
      M.P = P

      const ills: Box[] = []
      const nodes: Box[] = []
      const dots: Box[] = []
      const txts: Box[] = []
      let txtH = 0
      for (let i = 0; i < N; i++) {
        const ill = illRefs.current[i]
        const node = nodeRefs.current[i]
        const dot = dotRefs.current[i]
        const txt = txtRefs.current[i]
        const body = bodyRefs.current[i]
        if (!ill || !node || !dot || !txt || !body) return true
        ills.push(offsetIn(ill, stage))
        nodes.push(offsetIn(node, stage))
        dots.push(offsetIn(dot, stage))
        const t = offsetIn(txt, stage)
        txts.push(t)
        // the body may sit outside the text box (phones' overview): count it
        const b = offsetIn(body, stage)
        txtH = Math.max(txtH, t.h, b.y + b.h - t.y)
      }
      // the overview itself must fit, or there is nothing to land on
      if (list.offsetHeight > H + 1) return false

      const aspect = ills[0].h / (ills[0].w || 1)
      const dotH = dots[0].h
      let TW = Math.min(num(cs, "--t-ill", 300), W * num(cs, "--t-ill-frac", 0.86))
      let sT = num(cs, "--t-txt", 1.3)
      let g1 = num(cs, "--t-gap1", 44)
      let g2 = num(cs, "--t-gap2", 26)
      const want = TW * aspect + g1 + dotH + g2 + sT * txtH
      const f = Math.min(1, (H * 0.96) / want)
      if (f < MIN_FIT) return false
      TW *= f
      sT *= f
      g1 *= f
      g2 *= f
      const yIll = (H - want * f) / 2
      const yLine = yIll + TW * aspect + g1 + dotH / 2

      M.ill = []
      M.node = []
      M.txt = []
      for (let i = 0; i < N; i++) {
        const x0 = i * P
        M.ill.push({ tx: x0 - ills[i].x, ty: yIll - ills[i].y, s: TW / (ills[i].w || 1) })
        // the node moves so its DOT lands on the line at the card's left
        M.node.push({ tx: x0 - dots[i].x, ty: yLine - dotH / 2 - dots[i].y })
        M.txt.push({ tx: x0 - txts[i].x, ty: yLine + dotH / 2 + g2 - txts[i].y, s: sT })
      }
      const half = dots[0].w / 2
      M.tA = [half, yLine]
      M.tB = [(N - 1) * P + half, yLine]
      M.oA = [dots[0].x + half, dots[0].y + dots[0].h / 2]
      M.oB = [dots[N - 1].x + half, dots[N - 1].y + dots[N - 1].h / 2]
      return true
    }

    // Every write goes through set(): unchanged values are dropped.
    const last = new Map<string, string>()
    const set = (
      el: Element | null | undefined,
      prop: "transform" | "opacity" | "stroke-dashoffset",
      val: string,
      key: string,
    ) => {
      if (!el || last.get(key) === val) return
      last.set(key, val)
      ;(el as HTMLElement).style.setProperty(prop, val)
    }
    const op = (el: Element | null | undefined, v: number, key: string) => set(el, "opacity", clamp01(v).toFixed(3), key)

    /** The camera, in steps (0..N-1): four legs, each a move then a hold. */
    const camAt = (p: number) => {
      const t = (N - 1) * seg(p, TRAVEL_A, TRAVEL_B)
      if (t >= N - 1) return N - 1
      const k = Math.floor(t)
      return k + ease(seg(t - k, 0, LEG_MOVE))
    }

    const line = (el: HTMLElement | null, ax: number, ay: number, bx: number, by: number, frac: number, key: string) => {
      const len = Math.hypot(bx - ax, by - ay) * frac
      const ang = Math.atan2(by - ay, bx - ax)
      set(
        el,
        "transform",
        `translate(${ax.toFixed(1)}px, ${(ay - 1).toFixed(1)}px) rotate(${ang.toFixed(4)}rad) scaleX(${(len / 100).toFixed(4)})`,
        key,
      )
    }

    const draw = (p: number, approach: number) => {
      const c = camAt(p)
      const cam = c * M.P
      const z = ease(seg(p, ZOOM_A, ZOOM_B))
      for (let i = 0; i < N; i++) {
        // arrival: step 1 draws as the section scrolls in, the rest as they
        // slide in from the right toward the front of the line
        const r = i === 0 ? approach : seg(c, i - 0.72, i - 0.06)
        const past = i < N - 1 ? seg(c, i + 0.3, i + 0.85) : 0
        // phones show one step per screen: a passed step leaves entirely
        const dim = lerp(1 - (1 - (M.phone ? 0 : PAST_DIM)) * past, 1, z)
        // the art
        const a = M.ill[i]
        if (!a) continue
        set(
          illRefs.current[i],
          "transform",
          z >= 1 ? "none" : `translate(${lerp(a.tx - cam, 0, z).toFixed(1)}px, ${lerp(a.ty, 0, z).toFixed(1)}px) scale(${lerp(a.s, 1, z).toFixed(4)})`,
          `iT${i}`,
        )
        op(illRefs.current[i], Math.min(1, r * 6) * dim, `iO${i}`)
        const ds = draws[i]
        const n = ds.length
        for (let j = 0; j < n; j++) {
          const start = (j / n) * 0.4
          set(ds[j], "stroke-dashoffset", (1 - ease(seg(r, start, start + 0.6))).toFixed(3), `d${i}.${j}`)
        }
        const fo = seg(r, 0.45, 1).toFixed(3)
        for (let j = 0; j < fades[i].length; j++) set(fades[i][j], "opacity", fo, `f${i}.${j}`)
        // the node: the dot rides the line; ahead of you it waits, faint
        const nd = M.node[i]
        set(
          nodeRefs.current[i],
          "transform",
          z >= 1 ? "none" : `translate(${lerp(nd.tx - cam, 0, z).toFixed(1)}px, ${lerp(nd.ty, 0, z).toFixed(1)}px)`,
          `nT${i}`,
        )
        op(nodeRefs.current[i], 0.35 + 0.65 * seg(r, 0, 0.5), `nO${i}`)
        op(dotFillRefs.current[i], seg(r, 0.55, 1), `dF${i}`)
        // the text rises in after the art has started
        const tr = ease(seg(r, 0.3, 1))
        const t = M.txt[i]
        set(
          txtRefs.current[i],
          "transform",
          z >= 1
            ? "none"
            : `translate(${lerp(t.tx - cam, 0, z).toFixed(1)}px, ${(lerp(t.ty, 0, z) + (1 - tr) * TEXT_RISE * (1 - z)).toFixed(1)}px) scale(${lerp(t.s, 1, z).toFixed(4)})`,
          `tT${i}`,
        )
        op(txtRefs.current[i], tr * dim, `tO${i}`)
        // phones' overview is number + title only: bodies leave in the zoom
        op(bodyRefs.current[i], M.phone ? 1 - seg(z, 0, 0.4) : 1, `bO${i}`)
      }
      // the end label swaps sides on phones (above the line -> under the list)
      op(endUpRef.current, M.phone ? 1 - seg(z, 0, 0.5) : 1, "eU")
      op(endDownRef.current, M.phone ? seg(z, 0.5, 1) : 0, "eD")
      // the line, end to end; the fill tip rides the step in front of you
      const ax = lerp(M.tA[0] - cam, M.oA[0], z)
      const ay = lerp(M.tA[1], M.oA[1], z)
      const bx = lerp(M.tB[0] - cam, M.oB[0], z)
      const by = lerp(M.tB[1], M.oB[1], z)
      line(trackRef.current, ax, ay, bx, by, 1, "track")
      line(fillRef.current, ax, ay, bx, by, c / (N - 1), "fill")
    }

    let raf: number | null = null
    const update = () => {
      raf = null
      if (disposed) return
      // no layout read: where the runway sits and how far it scrolls are measured
      const y = window.scrollY
      const p = M.runTotal > 0 ? clamp01((y - M.runTop) / M.runTotal) : 0
      const approach = ease(seg(y, M.runTop - 0.6 * M.vh, M.runTop - 0.08 * M.vh))
      draw(p, approach)
    }
    const onScroll = () => {
      if (raf === null) raf = requestAnimationFrame(update)
    }
    // Set on cleanup. The refs outlive this effect (they point at the static
    // fallback's nodes once it renders), so a late callback — fonts.ready
    // resolving after a switch to static — must never write through them.
    let disposed = false
    const onResize = () => {
      if (disposed) return
      if (!measure()) {
        setShort(true)
        return
      }
      last.clear()
      onScroll()
    }
    if (!measure()) {
      setShort(true)
      return
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)
    const ro = new ResizeObserver(onResize)
    ro.observe(stage)
    // anything above the runway changing height moves where it starts
    ro.observe(document.documentElement)
    document.fonts?.ready.then(onResize).catch(() => {})
    return () => {
      disposed = true
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      ro.disconnect()
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [pinned, steps.length])

  const last = steps.length - 1
  // Only the scene's copy carries refs: in "ssr" both copies are mounted, and
  // a shared object ref would be nulled when the static copy unmounts.
  const renderList = (live: boolean) => (
    <ol className={s.list} ref={live ? listRef : undefined}>
      {steps.map((step, i) => (
        <li key={step.number} className={s.step}>
          <div
            className={s.ill}
            ref={
              live
                ? (el) => {
                    illRefs.current[i] = el
                  }
                : undefined
            }
          >
            <SetupIllustration index={i} />
          </div>
          <div
            className={s.node}
            aria-hidden="true"
            ref={
              live
                ? (el) => {
                    nodeRefs.current[i] = el
                  }
                : undefined
            }
          >
            <span
              className={s.dot}
              ref={
                live
                  ? (el) => {
                      dotRefs.current[i] = el
                    }
                  : undefined
              }
            >
              <span
                className={s.dotFill}
                ref={
                  live
                    ? (el) => {
                        dotFillRefs.current[i] = el
                      }
                    : undefined
                }
              />
            </span>
            {i === 0 ? <span className={s.lbl}>{axisStart}</span> : null}
            {i === last ? (
              <>
                <span className={cn(s.lbl, s.lblUp)} ref={live ? endUpRef : undefined}>
                  {axisEnd}
                </span>
                <span className={cn(s.lbl, s.lblDown)} ref={live ? endDownRef : undefined}>
                  {axisEnd}
                </span>
              </>
            ) : null}
          </div>
          <div
            className={s.txt}
            ref={
              live
                ? (el) => {
                    txtRefs.current[i] = el
                  }
                : undefined
            }
          >
            <span className={s.num} aria-hidden="true">
              {step.number}
            </span>
            <h3 className={s.title}>{step.title}</h3>
            <p
              className={s.body}
              ref={
                live
                  ? (el) => {
                      bodyRefs.current[i] = el
                    }
                  : undefined
              }
            >
              {step.body}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )

  const next = (
    <a href={nextHref} className={s.next}>
      {nextLabel}
      <span aria-hidden="true">↓</span>
    </a>
  )

  const staticVersion = (
    <div className={cn(s.static, s.wrap, mode === "ssr" && s.staticSlot)}>
      <div className={s.head}>{header}</div>
      <div className={s.stage}>{renderList(false)}</div>
      {next}
    </div>
  )
  if (mode === "static") return staticVersion

  return (
    <>
      <div
        ref={runwayRef}
        className={cn(s.runway, s.pinned)}
        data-live={pinned ? "" : undefined}
        style={{ height: `${RUNWAY_VH}vh` }}
      >
        <div className={s.pin}>
          <div className={cn(s.wrap, s.head)}>{header}</div>
          <div className={cn(s.wrap, s.stageWrap)}>
            <div className={s.stage} ref={stageRef}>
              <div className={s.lineWrap} aria-hidden="true">
                <span className={s.track} ref={trackRef} />
                <span className={s.fill} ref={fillRef} />
              </div>
              {renderList(true)}
            </div>
          </div>
          <div className={s.wrap}>{next}</div>
        </div>
      </div>
      {mode === "ssr" ? staticVersion : null}
    </>
  )
}
