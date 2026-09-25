"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { clamp01, ease, seg } from "../story/fold"
import { SetupIllustration } from "./Illustrations"
import s from "./setup.module.css"

/**
 * §05 "How do I get it?" — the five install steps as a timeline that LIGHTS
 * UP as you scroll (Web 2.1 P3-B3, Nico 2026-09-25: "start with one, show the
 * whole timeline, and then it lights up orange with each point appearing").
 *
 * The layout never moves. From the first frame the pin shows the finished
 * overview — all five slots in a row on the 0 min -> about 15 min axis — with
 * steps 2-5 waiting: a faint ghost of their art, a grey dot, a grey number, a
 * grey line, no words. Each scroll leg lights the next step: the orange line
 * runs to its dot, the dot and number turn orange, the art draws in (the
 * illustrations' stroke-dashoffset contract) and the title + body rise in.
 * Lit steps stay lit — nothing slides away, so there is never an empty region.
 *
 * One continuous value drives everything: `c`, the lit position in steps
 * (0 = step 1's dot, N-1 = the last). Connector k fills with c - k; step i is
 * lit as c reaches i.
 *
 *   desktop (>= 821px): pinned. Step 1 lights as the section scrolls in
 *     (c: -1 -> 0 on the approach), then four legs on p (each a move of the
 *     line, then a hold), then a hold on the whole lit row and the pin
 *     releases into the demo form (#demo).
 *   phones (<= 820px): NOT pinned — the same stacked list scrolls normally
 *     and c follows a reading line (62% down the screen) from dot to dot, so
 *     each step lights as it reaches it.
 *
 * Perf contract (RetainStory's): the frame WRITES only transform, opacity and
 * stroke-dashoffset (through a change cache) and READS nothing from layout;
 * measure() runs on mount, resize and font load only.
 *
 * Accessibility: the steps are one real <ol> in DOM order; art, the dots and
 * the minute axis are aria-hidden. Reduced motion, a screen too short to hold
 * the pinned row, no JS and the server render all get the finished overview
 * as a static layout.
 */

/** Scroll budget for the pinned scene, in viewport heights, after the 100vh pin. */
const SCROLL_VH = 150
/** The runway: the pinned viewport plus the scene's scroll (desktop only — CSS). */
const RUNWAY_VH = 100 + SCROLL_VH
/** Beats on p: the four legs (steps 2-5), then a hold to the release. */
const LEGS_A = 0.03
const LEGS_B = 0.84
/** Each leg moves the line over this share of its span, then holds. */
const LEG_MOVE = 0.62
/** Where the phone reading line sits, as a share of the viewport height. */
const READ_AT = 0.62
/** How far below its spot a step's words start as they arrive (px). */
const TEXT_RISE = 14
/** A waiting step's art: a faint ghost of the finished drawing. */
const GHOST = 0.14

export type SetupStep = { number: string; title: string; body: string }

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
  // then the static overview). The runway's height is CSS (a fixed vh on
  // desktop, its content on phones), so the section is its final height from
  // the first paint and never grows at hydration — #demo / #faq deep links
  // land true. After mount JS keeps only one: "scene", or "static" for reduced
  // motion and desktop screens too short to hold the row.
  const [reduced, setReduced] = useState<boolean | null>(null)
  // `short` flips to true when the screen can't hold the pinned row (see measure()).
  const [short, setShort] = useState(false)
  const mode: "ssr" | "scene" | "static" = reduced === null ? "ssr" : reduced || short ? "static" : "scene"
  const live = mode === "scene"

  const runwayRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const inkRefs = useRef<(HTMLDivElement | null)[]>([])
  const ghostRefs = useRef<(HTMLDivElement | null)[]>([])
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([])
  const ringRefs = useRef<(HTMLSpanElement | null)[]>([])
  const dotFillRefs = useRef<(HTMLSpanElement | null)[]>([])
  const numOnRefs = useRef<(HTMLSpanElement | null)[]>([])
  const copyRefs = useRef<(HTMLDivElement | null)[]>([])
  const connRefs = useRef<(HTMLSpanElement | null)[]>([])

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
    if (!live) return
    const stage = stageRef.current
    const list = listRef.current
    const runway = runwayRef.current
    if (!stage || !list || !runway) return
    const N = steps.length

    // Collected ONCE: each step's drawable strokes and fading fills (the ink
    // copy only — the ghost copy is drawn complete by CSS).
    const draws = inkRefs.current.map((el) => Array.from(el?.querySelectorAll<SVGPathElement>("[data-d]") ?? []))
    const fades = inkRefs.current.map((el) => Array.from(el?.querySelectorAll<SVGPathElement>("[data-f]") ?? []))

    /** Everything the frame needs. Rebuilt by measure() only. */
    const M = {
      phone: false,
      runTop: 0,
      runTotal: 0,
      vh: 1,
      /** phones: each dot's centre, in document px */
      dotY: [] as number[],
    }

    /** Returns false when the screen can't hold the pinned row. */
    const measure = (): boolean => {
      M.vh = window.innerHeight || 1
      M.phone = parseFloat(getComputedStyle(stage).getPropertyValue("--t-phone")) > 0
      M.runTop = runway.getBoundingClientRect().top + window.scrollY
      M.runTotal = Math.max(0, runway.offsetHeight - M.vh)
      if (M.phone) {
        const top = stage.getBoundingClientRect().top + window.scrollY
        M.dotY = []
        for (let i = 0; i < N; i++) {
          const dot = dotRefs.current[i]
          if (!dot) return true
          const b = offsetIn(dot, stage)
          M.dotY.push(top + b.y + b.h / 2)
        }
        return true
      }
      // the row itself must fit the pin, or there is nothing to light
      return list.offsetHeight <= stage.clientHeight + 1
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

    /** Desktop: the lit position from the approach and the runway. */
    const cDesk = (y: number) => {
      if (y < M.runTop) return ease(seg(y, M.runTop - 0.6 * M.vh, M.runTop - 0.08 * M.vh)) - 1
      const p = M.runTotal > 0 ? clamp01((y - M.runTop) / M.runTotal) : 1
      const t = (N - 1) * seg(p, LEGS_A, LEGS_B)
      if (t >= N - 1) return N - 1
      const k = Math.floor(t)
      return k + ease(seg(t - k, 0, LEG_MOVE))
    }
    /** Phones: the reading line's position between the dots it sits between. */
    const cPhone = (y: number) => {
      const d = M.dotY
      if (d.length < 2) return N - 1
      const r = y + READ_AT * M.vh
      if (r <= d[0]) return (r - d[0]) / (d[1] - d[0] || 1)
      for (let k = 0; k < d.length - 1; k++) {
        if (r < d[k + 1]) return k + (r - d[k]) / (d[k + 1] - d[k] || 1)
      }
      return N - 1
    }

    const draw = (c: number) => {
      for (let i = 0; i < N; i++) {
        // the art draws in as the line runs the last stretch to its dot
        const r = seg(c, i - 0.6, i)
        const ds = draws[i]
        const n = ds.length
        for (let j = 0; j < n; j++) {
          const start = (j / n) * 0.4
          set(ds[j], "stroke-dashoffset", (1 - ease(seg(r, start, start + 0.6))).toFixed(3), `d${i}.${j}`)
        }
        const fo = seg(r, 0.45, 1).toFixed(3)
        for (let j = 0; j < fades[i].length; j++) set(fades[i][j], "opacity", fo, `f${i}.${j}`)
        op(ghostRefs.current[i], GHOST * (1 - seg(r, 0.6, 1)), `g${i}`)
        // the dot and the number turn orange as the line arrives
        const hit = seg(c, i - 0.14, i)
        op(ringRefs.current[i], hit, `rg${i}`)
        op(dotFillRefs.current[i], hit, `dF${i}`)
        op(numOnRefs.current[i], hit, `nO${i}`)
        // the words rise in after the art has started
        const tr = ease(seg(r, 0.3, 1))
        set(copyRefs.current[i], "transform", `translateY(${((1 - tr) * TEXT_RISE).toFixed(1)}px)`, `cT${i}`)
        op(copyRefs.current[i], tr, `cO${i}`)
        // the line to the next dot
        if (i < N - 1) {
          const f = clamp01(c - i).toFixed(4)
          set(connRefs.current[i], "transform", M.phone ? `scaleY(${f})` : `scaleX(${f})`, `L${i}`)
        }
      }
    }

    let raf: number | null = null
    // Set on cleanup. The refs outlive this effect, so a late callback —
    // fonts.ready resolving after a switch to static — must never write through them.
    let disposed = false
    const update = () => {
      raf = null
      if (disposed) return
      // no layout read: where the runway and the dots sit is measured
      const y = window.scrollY
      draw(M.phone ? cPhone(y) : cDesk(y))
    }
    const onScroll = () => {
      if (raf === null) raf = requestAnimationFrame(update)
    }
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
  }, [live, steps.length])

  const lastIndex = steps.length - 1
  /** A callback ref into one of the per-step arrays — only on the scene's copy. */
  const into =
    <T extends Element>(on: boolean, arr: { current: (T | null)[] }, i: number) =>
    (el: T | null) => {
      if (on) arr.current[i] = el
    }
  // Only the scene's copy carries refs: in "ssr" both copies are mounted, and
  // a shared ref would be nulled when the static copy unmounts.
  const renderList = (scene: boolean) => (
    <ol className={s.list} ref={scene ? listRef : undefined}>
      {steps.map((step, i) => (
        <li key={step.number} className={s.step}>
          <div className={s.ill}>
            {scene ? (
              <div className={s.ghost} aria-hidden="true" ref={into(scene, ghostRefs, i)}>
                <SetupIllustration index={i} />
              </div>
            ) : null}
            <div className={s.ink} ref={into(scene, inkRefs, i)}>
              <SetupIllustration index={i} />
            </div>
          </div>
          <div className={s.node} aria-hidden="true">
            {i < lastIndex ? (
              <span className={s.conn}>
                <span className={s.connFill} ref={into(scene, connRefs, i)} />
              </span>
            ) : null}
            <span className={s.dot} ref={into(scene, dotRefs, i)}>
              <span className={s.dotRing} ref={into(scene, ringRefs, i)} />
              <span className={s.dotFill} ref={into(scene, dotFillRefs, i)} />
            </span>
            {i === 0 ? <span className={s.lbl}>{axisStart}</span> : null}
            {i === lastIndex ? (
              <>
                <span className={cn(s.lbl, s.lblUp)}>{axisEnd}</span>
                <span className={cn(s.lbl, s.lblDown)}>{axisEnd}</span>
              </>
            ) : null}
          </div>
          <div className={s.txt}>
            <span className={s.num} aria-hidden="true">
              {step.number}
              <span className={s.numOn} ref={into(scene, numOnRefs, i)}>
                {step.number}
              </span>
            </span>
            <div className={s.copy} ref={into(scene, copyRefs, i)}>
              <h3 className={s.title}>{step.title}</h3>
              <p className={s.body}>{step.body}</p>
            </div>
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
    <div className={cn(s.static, s.wrap, mode === "ssr" && s.staticSlot)} data-nojs="static">
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
        data-nojs="runway"
        data-live={live ? "" : undefined}
        style={{ "--runway-h": `${RUNWAY_VH}vh` } as CSSProperties}
      >
        <div className={s.pin}>
          <div className={cn(s.wrap, s.head)}>{header}</div>
          <div className={cn(s.wrap, s.stageWrap)}>
            <div className={s.stage} ref={stageRef}>
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
